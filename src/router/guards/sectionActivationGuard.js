// router/guard/sectionActivationGuard.js
import { lazy } from "@/utils/lazy";
import { preloadAsset } from "@/utils/sectionActivator";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSectionsStore } from "@/stores/sections";
import routesJson from "@/router/routeConfig.json";

function getCompPath(route, role) {
  return (
    route.customComponentPath?.[role]?.componentPath || route.componentPath
  );
}

function getEntryForSection(section, role) {
  const sectionRoutes = routesJson.filter(
    (r) => r.section === section && !r.redirect
  );
  let entryRoute =
    sectionRoutes.find((r) => !r.inheritConfigFromParent) || sectionRoutes[0];
  if (!entryRoute) {
    console.warn(
      `[PRELOAD_SECTIONS] No valid entry route found for section "${section}"`
    );
    return null;
  }
  return getCompPath(entryRoute, role);
}

export function installSectionActivationGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const section = to.meta?.section;
    if (!section) {
      console.log(`[ROUTING] No section defined for route "${to.path}"`);
      return next();
    }

    // Ensure sections store is hydrated BEFORE we check activation state
    const sectionsStore = useSectionsStore();
    try {
      sectionsStore.hydrate();
    } catch (err) {
      console.warn(`[HYDRATE] Failed to hydrate sections store:`, err);
    }

    console.log(
      `\n[ROUTING] Navigating to "${to.path}" in section "${section}"`
    );

    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";

    const compPath = getCompPath(to.meta, role);
    if (!compPath) {
      console.error(`[ERROR] No component path for "${to.path}"`);
      return next("/404");
    }

    console.log(`[COMPONENT] Loading component for "${to.path}"`);
    let compModule;
    try {
      compModule = await lazy(compPath)();
    } catch (e) {
      console.error(
        `[ERROR] Failed to load component for "${to.path}": ${e?.message || e}`
      );
      return next("/404");
    }

    const assets = compModule.assets || { critical: [], high: [], normal: [] };
    const allAssets = {
      critical: Array.from(new Set(assets.critical || [])),
      high: Array.from(new Set(assets.high || [])),
      normal: Array.from(new Set(assets.normal || [])),
    };

    const totalCount =
      allAssets.critical.length +
      allAssets.high.length +
      allAssets.normal.length;
    console.log(
      `[ASSET] Component has ${totalCount} assets to preload (critical:${allAssets.critical.length}, high:${allAssets.high.length}, normal:${allAssets.normal.length})`
    );

    // Wait for DOMContentLoaded / interactive/complete
    await new Promise((resolve) => {
      if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
      ) {
        resolve();
      } else {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
        window.addEventListener("load", resolve, { once: true }); // fallback
      }
    });
    console.log("[DOM] Document ready (DOMContentLoaded/interactive/complete)");

    // Preload sequentially by priority. Within each priority, assets load in parallel.
    const priorities = ["critical", "high", "normal"];
    for (const prio of priorities) {
      const urls = allAssets[prio] || [];
      if (urls.length === 0) continue;

      console.log(`[ASSET] Preloading ${urls.length} ${prio} assets...`);
      const promises = urls.map((url) => {
        console.log(`[ASSET] Checking asset: ${url} (priority: ${prio})`);
        return preloadAsset(url)
          .then(() => {
            console.log(`[ASSET] Asset loaded: ${url}`);
          })
          .catch((err) => {
            console.error(`[ASSET] Failed to load asset: ${url}`, err);
          });
      });

      // Wait until all assets within this priority settle before moving to next priority
      await Promise.allSettled(promises);
      console.log(`[ASSET] ${prio} assets settled`);
    }

    console.log(`[ASSETS] All declared assets for "${to.path}" processed`);
    if (!sectionsStore.isActivated(section)) {
      sectionsStore.markActivated(section);
      console.log(`[SECTION] Marked "${section}" as activated`);
    }
    next();
  });

  // AFTER navigation, handle section entry preloads
  router.afterEach(async (to) => {
    const section = to.meta?.section;
    if (!section) return;

    const routingStartTime = performance.now();

    let preLoadSections = to.meta?.preLoadSections || [];
    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const additional = ["auth"];
    if (section === "profile" && role === "creator") {
      additional.push("dashboard");
    }
    preLoadSections = [...new Set([...preLoadSections, ...additional])].filter(
      (s) => s !== section
    );

    const sectionsStore = useSectionsStore();

    if (preLoadSections.length > 0) {
      console.log(
        `[PRELOAD_SECTIONS] Starting preload for: ${preLoadSections.join(", ")}`
      );
      for (const otherSection of preLoadSections) {
        if (sectionsStore.isActivated(otherSection)) {
          console.log(
            `[PRELOAD_SECTIONS] Section "${otherSection}" already activated, skipping preload`
          );
          continue;
        }
        const entryComp = getEntryForSection(otherSection, role);
        if (entryComp) {
          console.log(
            `[PRELOAD_SECTIONS] Preloading entry code for section "${otherSection}"`
          );
          try {
            await lazy(entryComp)();
            console.log(
              `[PRELOAD_SECTIONS] Entry code for section "${otherSection}" preloaded`
            );
            sectionsStore.markActivated(otherSection);
          } catch (err) {
            console.error(
              `[PRELOAD_SECTIONS] Failed to preload entry for "${otherSection}":`,
              err
            );
          }
        } else {
          console.warn(
            `[PRELOAD_SECTIONS] No entry found for section "${otherSection}"`
          );
        }
      }
      console.log(
        `[PRELOAD_SECTIONS] All preloading completed in ${(
          performance.now() - routingStartTime
        ).toFixed(2)}ms.`
      );
    }
  });
}
