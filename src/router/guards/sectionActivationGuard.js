import { lazy } from "@/utils/lazy";
import { preloadAsset } from "@/utils/sectionActivator";
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
  let entryRoute =
    sectionRoutes.find((r) => !r.inheritConfigFromParent) || sectionRoutes[0];
  if (!entryRoute) {
    return null;
  }
  return getCompPath(entryRoute, role);
}
export function installSectionActivationGuard(router) {
  router.beforeEach(async (to, from, next) => {
    const section = to.meta?.section;
    if (!section) return next();
    const sectionsStore = useSectionsStore();
    sectionsStore.hydrate();
    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const compPath = getCompPath(to.meta, role);
    if (!compPath) {
      return next("/404");
    }
    let compModule;
    try {
      compModule = await lazy(compPath)();
    } catch (e) {
      return next("/404");
    }
    const assets = compModule.assets || { critical: [], high: [], normal: [] };
    const allAssets = [
      ...new Set([...assets.critical, ...assets.high, ...assets.normal]),
    ];
    if (sectionsStore.isActivated(section)) {
      to.meta._assetPromises = [];
      to.meta._assetPromisesAssets = [];
    } else {
      const assetPromises = allAssets.map((url) => preloadAsset(url, true));
      to.meta._assetPromises = assetPromises; // Pass to afterEach
      to.meta._assetPromisesAssets = allAssets;
    }
    next();
  });
  router.afterEach(async (to) => {
    const section = to.meta?.section;
    if (!section) return;
    const slug = to.meta?.slug;
    if (!section) return;
    const domReady = new Promise((resolve) => {
      if (
        document.readyState === "interactive" ||
        document.readyState === "complete"
      )
        resolve();
      else
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
    await domReady;

    const sectionName = toFriendlyName(section);
    const pageName = toFriendlyName(slug);
    console.log(`✅ Step 1: DOM content finished loading for ${pageName}`);

    if (to.meta._assetPromises?.length > 0) {
      await Promise.all(to.meta._assetPromises);
      console.log(
        `✅ Step 2: Downloaded all assets (JS, CSS, Images) for ${pageName}`
      );
      sectionsStore.markActivated(section);
    } else {
      console.log(`♻️ Skipping preload: ${pageName} already loaded`);
    }

    const authStore = useAuthStore();
    const role =
      authStore.simulate?.role || authStore.currentUser?.role || "creator";
    const preLoadSection = to.meta.preLoadSections?.[0];
    const sectionsStore = useSectionsStore();
    if (preLoadSection) {
      if (!sectionsStore.isActivated(preLoadSection)) {
        const sectionName = toFriendlyName(preLoadSection);
        console.log(`➡️ Step 3: Preloading next section: ${sectionName}`);

        const entryComp = getEntryForSection(preLoadSection, role);
        if (!entryComp) return;
        let entryModule;
        try {
          entryModule = await lazy(entryComp)();
        } catch (err) {
          console.error(
            `Failed to preload bundle for section "${preLoadSection}"`,
            err
          );
          return;
        }
        const { critical, high, normal } = normalizeAssets(entryModule);
        const entryAssets = [...new Set([...critical, ...high, ...normal])];
        const entryPromises = entryAssets.map((url) => preloadAsset(url, true));
        await Promise.all(entryPromises);
        sectionsStore.markActivated(preLoadSection);
      } else {
        const sectionName = toFriendlyName(preLoadSection);
        console.log(`♻️ Skipping preload: ${sectionName} already loaded`);
      }
    }

    console.log(`✨ Done: ${pageName} fully ready`);
  });
}
function normalizeAssets(mod) {
  return mod.assets || { critical: [], high: [], normal: [] };
}
