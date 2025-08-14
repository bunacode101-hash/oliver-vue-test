import { useSectionCache } from "@/stores/sectionCache";
import AssetHandler from "@/assets/AssetHandlerNew"; // adjust import name/path
import routesJson from "@/router/routes.json";

function getVersion() {
  return import.meta.env?.VITE_APP_VERSION ?? "dev";
}

// Extract assets export (component or module)
function collectDeclaredAssets(componentModule) {
  const mod = componentModule;
  const comp = mod?.default ?? mod;
  const a = mod?.assets || comp?.assets || {};
  const norm = (arr) => (Array.isArray(arr) ? arr.filter(Boolean) : []);
  return {
    critical: norm(a.critical),
    high: norm(a.high),
    normal: norm(a.normal),
  };
}

// Send to AssetHandler using flags; it resolves priorities internally (critical > high > normal)
async function preloadAssetsForFlags(flags) {
  // AssetHandler API is flags-based; just pass our flags.
  try {
    AssetHandler?.preloadAssetsByFlag?.(...flags);
  } catch {}
}

// Build flags for a route/section
function flagsFor(section, routePath) {
  const list = new Set();
  if (section) list.add(section);
  if (routePath) list.add(routePath); // allow route-specific flags
  return Array.from(list);
}

export const SectionPrefetcher = (() => {
  const warmedSectionModules = new Map(); // section → component keys
  let bootVersionSet = false;

  function ensureAssetHandlerVersion() {
    if (bootVersionSet) return;
    const v = getVersion();
    try {
      AssetHandler?.setGlobalVersion?.(v);
    } catch {}
    bootVersionSet = true;
  }

  async function ensureSectionWarm(section, routerGetRoutes) {
    if (!section) return;
    ensureAssetHandlerVersion();

    const cache = useSectionCache();
    if (cache.isSectionWarm(section)) return;

    // 1) Collect all routes in this section
    const allRoutes = routerGetRoutes()
      .filter((rr) => rr.meta?.section === section)
      .map((rr) => ({
        path: rr.path,
        meta: rr.meta,
        component: rr.components?.default || rr.component,
      }));

    const componentKeys = new Set();
    const allFlags = new Set();
    allFlags.add(section);

    // 2) Pre-import code for each route (lazy functions)
    await Promise.allSettled(
      allRoutes.map(async (r) => {
        const loader = r.component;
        if (typeof loader !== "function") return;
        try {
          const mod = await loader();
          // record some identity for warmComponents
          const key =
            mod?.__file || mod?.default?.__file || mod?.default?.name || r.path;
          if (key) cache.markComponentWarm(key), componentKeys.add(key);
          // gather flags: section + route path
          flagsFor(section, r.path).forEach((f) => allFlags.add(f));
          // collect declared assets (no URLs sent directly; we use flags with AssetHandler)
          // If you want to directly load those URLs too, you could dispatch custom flags per-URL here.
        } catch {
          /* swallow; still continue warming others */
        }
      })
    );

    // 3) Preload assets by flags using AssetHandler (section + individual route slugs)
    await preloadAssetsForFlags(Array.from(allFlags));

    warmedSectionModules.set(section, componentKeys);
    cache.markSectionWarm(section);
  }

  // role-aware dynamic preload additions
  function dynamicPreloadsForRoute(to, userRole) {
    const list = new Set();
    // Always include "auth" to keep it hot
    list.add("auth");

    // from JSON meta preLoadSections
    const jsonMatch = routesJson.find((r) => r.slug === to.path);
    (jsonMatch?.preLoadSections || []).forEach((s) => s && list.add(s));

    // additional custom logic
    const section = to.meta?.section;
    if (section === "profile" && userRole === "creator") list.add("dashboard");

    return Array.from(list);
  }

  return {
    ensureSectionWarm,
    dynamicPreloadsForRoute,
    ensureAssetHandlerVersion,
  };
})();
