import AssetHandler from "@/assets/AssetHandlerNew";

let useSectionCache = null;
async function getSectionCache() {
  if (!useSectionCache) {
    try {
      const module = await import("@/stores/sectionCache");
      useSectionCache = module.useSectionCache;
      return useSectionCache();
    } catch (e) {
      console.error("[LoadChecker] Failed to load useSectionCache store:", e);
      throw new Error("Pinia store not available. Ensure app.use(pinia) is called.");
    }
  }
  return useSectionCache();
}

export function createRouteLoadChecker() {
  let isRouteLoaded = false;
  let isAssetsLoaded = false;
  let assetHandler = null;

  async function initCache() {
    const cache = await getSectionCache();
    return cache;
  }

  function initAssetHandler(section = "default") {
    if (!assetHandler) {
      assetHandler = new AssetHandler([], section);
      assetHandler.onAssetsLoaded = (success) => {
        if (success) {
          console.log(`[LoadChecker] Assets for section ${assetHandler.section} loaded successfully`);
          isAssetsLoaded = true;
          checkAndNotify();
        } else {
          console.error(`[LoadChecker] Failed to load assets for section ${assetHandler.section}`);
        }
      };
    }
  }

  function checkAndNotify() {
    if (isRouteLoaded && isAssetsLoaded) {
      initCache().then((cache) => {
        console.log(`[LoadChecker] Current route ${window.location.pathname} and assets fully loaded`);
        cache.markSectionPreloaded(assetHandler.section || "default");
      });
    }
  }

  return {
    init(section = "default") {
      return new Promise((resolve) => {
        initAssetHandler(section);
        // Simulate route load (replace with actual router readiness check)
        isRouteLoaded = true; // Placeholder, update with real logic
        checkAndNotify();
        resolve();
      });
    },
    isFullyLoaded() {
      return isRouteLoaded && isAssetsLoaded;
    },
  };
}

export const routeLoadChecker = createRouteLoadChecker();