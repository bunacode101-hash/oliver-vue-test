// router/guard/sectionActivationGuard.js
import { lazy } from "@/utils/lazy";
import { preloadAsset, preloadAssets } from "@/utils/sectionActivator";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSectionsStore } from "@/stores/sectionStore";
import routesJson from "@/router/routeConfig.json";

function toFriendlyName(key) {
  return key
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCompPath(route, role) {
  return (
    route.customComponentPath?.[role]?.componentPath || route.componentPath
  );
}

function getEntryForSection(section, role) {
  const sectionRoutes = routesJson.filter(
    (r) => r.section === section && !r.redirect
  );
  console.log(
    `[SECTION] Found ${sectionRoutes.length} routes for section "${section}"`
  );
  let entryRoute =
    sectionRoutes.find((r) => !r.inheritConfigFromParent) || sectionRoutes[0];
  if (!entryRoute) {
    return null;
  }
  return getCompPath(entryRoute, role);
}

export function installSectionActivationGuard(router) {
  async function preloadSection(section, role, apply = false) {
    console.log(`➡️ Preloading section "${section}" (apply=${apply})`);
    const startTime = performance.now();
    const sectionRoutes = routesJson.filter(
      (r) => r.section === section && !r.redirect
    );
    console.log(
      `[SECTION] Found ${
        sectionRoutes.length
      } routes to preload in section "${section}": ${sectionRoutes
        .map((r) => r.slug)
        .join(", ")}`
    );
    const allAssets = new Set();
    const componentPromises = sectionRoutes.map(async (route) => {
      const compPath = getCompPath(route, role);
      if (!compPath) {
        console.warn(
          `[COMPONENT] No component path for route "${route.slug}" in section "${section}"`
        );
        return;
      }
      // console.log(
      //   `[COMPONENT] Loading component for route "${route.slug}" in section "${section}": ${compPath}`
      // );
      try {
        const mod = await lazy(compPath)();
        // console.log(`[COMPONENT] Loaded component for "${route.slug}"`);
        const assets = normalizeAssets(mod);
        [...assets.critical, ...assets.high, ...assets.normal].forEach((url) =>
          allAssets.add(url)
        );
      } catch (err) {
        // console.error(
        //   `[ERROR] Failed to load component for "${route.slug}"`,
        //   err
        // );
      }
    });
    await Promise.all(componentPromises);
    const assetList = [...allAssets];
    console.log(
      `[ASSETS] Total unique assets for section "${section}": ${
        assetList.length
      } [${assetList.join(", ")}]`
    );
    await preloadAssets(assetList, apply);
    const duration = performance.now() - startTime;
    console.log(
      `✅ Preloaded section "${section}" in ${duration.toFixed(2)}ms`
    );
  }

  router.beforeEach(async (to, from, next) => {
    const section = to.meta?.section;
    const slug = to.meta?.slug;
    if (!section) {
      console.log(`[ROUTING] No section defined for route "${to.path}"`);
      return next();
    }
    const authStore = useAuthStore();
    if (section === "dashboard" && !authStore.currentUser) {
      console.log(
        `[ROUTING] Skipping preload for protected section "${section}" without user`
      );
      return next();
    }
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    // console.log(
    //   `[ROUTING] Checking route "${to.path}", section "${section}", role "${role}"`
    // );
    const compPath = getCompPath(to.meta, role);
    if (!compPath) {
      console.log(
        `[ROUTING] No component path for "${to.path}", redirecting to /404`
      );
      return next("/404");
    }
    let compModule;
    try {
      // console.log(
      //   `[COMPONENT] Loading current component for "${slug}": ${compPath}`
      // );
      compModule = await lazy(compPath)();
      // console.log(`[COMPONENT] Loaded current component for "${slug}"`);
      // console.log(`[TEMPLATE] Vue template ready for "${slug}"`);
    } catch (e) {
      console.error(`[ERROR] Failed to load component for "${slug}"`, e);
      return next("/404");
    }
    const assets = compModule.assets || { critical: [], high: [], normal: [] };
    const allAssets = [
      ...new Set([...assets.critical, ...assets.high, ...assets.normal]),
    ];
    // console.log(
    //   `[ASSETS] Assets for current "${slug}": ${JSON.stringify(assets)}`
    // );
    // console.log(
    //   `[ASSETS] Total unique assets for current: ${
    //     allAssets.length
    //   } [${allAssets.join(", ")}]`
    // );
    to.meta._assetPromise = preloadAssets(allAssets, true);
    next();
  });

  router.afterEach(async (to) => {
    const section = to.meta?.section;
    const slug = to.meta?.slug;
    if (!section) return;
    const routingStartTime = performance.now();
    // console.log(
    //   `\n[ROUTING] Section activation for "${section}" (route "${to.path}")`
    // );
    const fullLoad = new Promise((resolve) => {
      if (document.readyState === "complete") {
        // console.log(
        //   `[DOM] Document already fully loaded for "${toFriendlyName(slug)}"`
        // );
        resolve();
      } else {
        window.addEventListener(
          "load",
          () => {
            console.log(
              `[DOM] Document fully loaded for "${toFriendlyName(slug)}"`
            );
            resolve();
          },
          { once: true }
        );
      }
    });
    console.log(
      `✅ Step 1: Waiting for full page load for "${toFriendlyName(slug)}"`
    );
    await fullLoad;
    console.log(
      `✅ Step 1: Full page load complete for "${toFriendlyName(slug)}"`
    );
    console.log(
      `✅ Step 2: Waiting for current assets apply for "${toFriendlyName(
        slug
      )}"`
    );
    await to.meta._assetPromise;
    console.log(
      `✅ Step 2: Applied all current assets for "${toFriendlyName(slug)}"`
    );
    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const sectionsStore = useSectionsStore();
    console.log(
      `➡️ Step 3: Preloading current section "${toFriendlyName(
        section
      )}" (if not activated)`
    );
    await sectionsStore.activateSection(section, () =>
      preloadSection(section, role, false)
    );
    let preLoadSections = to.meta.preLoadSections || [];
    preLoadSections = [...new Set([...preLoadSections, "auth"])].filter(
      (s) => s !== section
    );
    if (preLoadSections.length > 0) {
      console.log(
        `➡️ Step 4: Preloading config sections (including auth): ${preLoadSections
          .map(toFriendlyName)
          .join(", ")}`
      );
      for (const preSection of preLoadSections) {
        if (preSection === "dashboard" && !authStore.currentUser) {
          console.log(
            `♻️ Skipping preload for "${toFriendlyName(
              preSection
            )}" (no user)`
          );
          continue;
        }
        await sectionsStore.activateSection(preSection, () =>
          preloadSection(preSection, role, false)
        );
      }
    } else {
      console.log(`♻️ No additional sections to preload`);
    }
    const totalDuration = (performance.now() - routingStartTime).toFixed(2);
    console.log(
      `✨ Done: "${toFriendlyName(
        slug
      )}" fully ready (total ${totalDuration}ms)`
    );
  });
}

function normalizeAssets(mod) {
  return mod.assets || { critical: [], high: [], normal: [] };
}