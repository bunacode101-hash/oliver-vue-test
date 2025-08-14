import { useSectionCache } from "@/stores/sectionCache";
import {
  preloadByFlags,
  setAssetsVersionOnce,
} from "@/assets/assetHandlerGlue"; // Use instance via glue
import routesJson from "@/router/routeConfig.json";

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

// Build flags for a route/section
function flagsFor(section, routePath) {
  const list = new Set();
  if (section) list.add(section);
  if (routePath) list.add(routePath); // allow route-specific flags
  return Array.from(list);
}

// Direct preload function for declared assets (with priority, versioning, deduping)
const preloaded = new Set(); // Global dedupe set (or move to instance if preferred)
function preloadDeclaredAssets(assets, version) {
  const priorities = ["critical", "high", "normal"];
  priorities.forEach((priority) => {
    assets[priority].forEach((url) => {
      const versionedUrl = version ? `${url}?ver=${version}` : url;
      if (preloaded.has(versionedUrl)) return;

      console.log(`Preloading ${priority} asset: ${versionedUrl}`); // Debug

      if (url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else if (url.endsWith(".js")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else {
        // Images/media
        fetch(versionedUrl, { mode: "no-cors" });
      }

      preloaded.add(versionedUrl);
    });
  });
}

export const SectionPrefetcher = (() => {
  const warmedSectionModules = new Map(); // section → component keys
  let bootVersionSet = false;

  function ensureAssetHandlerVersion() {
    if (bootVersionSet) return;
    const v = getVersion();
    setAssetsVersionOnce(v); // Use glue for instance
    bootVersionSet = true;
  }

  async function ensureSectionWarm(section, routerGetRoutes) {
    if (!section) return;
    ensureAssetHandlerVersion();

    const cache = useSectionCache();
    if (cache.isSectionWarm(section)) {
      console.log(`Section ${section} already warm, skipping.`); // Debug
      return;
    }

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
    const version = getVersion(); // For asset versioning
    let allDeclaredAssets = { critical: [], high: [], normal: [] }; // Aggregate per section

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
          // Collect and aggregate declared assets
          const declared = collectDeclaredAssets(mod);
          Object.keys(declared).forEach((p) => {
            allDeclaredAssets[p] = [...allDeclaredAssets[p], ...declared[p]];
          });
        } catch (e) {
          console.error(`Error warming route ${r.path}:`, e); // Debug errors
        }
      })
    );

    // 3) Preload aggregated declared assets directly (priority order)
    preloadDeclaredAssets(allDeclaredAssets, version);

    // 4) Also call flag-based preload (if assetsConfig populated in glue)
    preloadByFlags(Array.from(allFlags)); // Use glue for instance

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
