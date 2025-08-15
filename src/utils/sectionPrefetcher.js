import { useSectionCache } from "@/stores/sectionCache";
import { preloadByFlags, setAssetsVersionOnce } from "@/assets/assetHandlerGlue";
import routesJson from "@/router/routeConfig.json";

function getVersion() {
  return import.meta.env?.VITE_APP_VERSION ?? "dev";
}

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

function flagsFor(section, routePath) {
  const list = new Set();
  if (section) list.add(section);
  if (routePath) list.add(routePath);
  return Array.from(list);
}

const preloaded = new Set();
function preloadDeclaredAssets(assets, version) {
  const priorities = ["critical", "high", "normal"];
  priorities.forEach((priority) => {
    assets[priority].forEach((url) => {
      const versionedUrl = version ? `${url}?ver=${version}` : url;
      if (preloaded.has(versionedUrl)) {
        return;
      }
      if (url.endsWith(".css") && priority === "critical") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else if (url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else if (url.endsWith(".js")) {
        const link = document.createElement("link");
         link.rel = "prefetch";
        link.as = "script";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else {
        fetch(versionedUrl, { mode: "no-cors" });
      }
      preloaded.add(versionedUrl);
    });
  });
}

export const SectionPrefetcher = (() => {
  const warmedSectionModules = new Map();
  const pendingWarms = new Map();
  let bootVersionSet = false;

  function ensureAssetHandlerVersion() {
    if (bootVersionSet) return;
    const v = getVersion();
    setAssetsVersionOnce(v);
    bootVersionSet = true;
  }

  async function ensureSectionWarm(section, routerGetRoutes) {
    if (!section) return;
    ensureAssetHandlerVersion();
    const cache = useSectionCache();
    if (cache.isSectionWarm(section)) {
      console.log(`Section ${section} already warm, skipping preload`);
      return;
    }

    let promise = pendingWarms.get(section);
    if (promise) {
      return promise;
    }

    promise = (async () => {
      try {
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
        const version = getVersion();
        let allDeclaredAssets = { critical: [], high: [], normal: [] };

        await Promise.allSettled(
          allRoutes.map(async (r) => {
            const loader = r.component;
            if (typeof loader !== "function") {
              return;
            }
            const key = r.path;
            if (cache.isSectionWarm(section) && warmedSectionModules.get(section)?.has(key)) {
              console.log(`Skipping import for warmed component: ${key}`);
              return;
            }
            try {
              const mod = await loader();
              const compKey = mod?.__file || mod?.default?.__file || mod?.default?.name || key;
              if (compKey) {
                cache.markComponentWarm(compKey);
                componentKeys.add(compKey);
              }
              flagsFor(section, r.path).forEach(f => allFlags.add(f));
              const declared = collectDeclaredAssets(mod);
              Object.keys(declared).forEach((p) => {
                allDeclaredAssets[p] = [...allDeclaredAssets[p], ...declared[p]];
              });
            } catch (e) {
              console.error(`Error warming route ${r.path}:`, e);
            }
          })
        );

        preloadDeclaredAssets(allDeclaredAssets, version);
        preloadByFlags(Array.from(allFlags));
        warmedSectionModules.set(section, componentKeys);
        cache.markSectionWarm(section);
      } finally {
        pendingWarms.delete(section);
      }
    })();

    pendingWarms.set(section, promise);
    return promise;
  }

  function dynamicPreloadsForRoute(to, userRole) {
    const list = new Set();
    list.add("auth");
    const jsonMatch = routesJson.find((r) => r.slug === to.path);
    (jsonMatch?.preLoadSections || []).forEach((s) => s && list.add(s));
    if (to.meta?.section === "profile" && userRole === "creator") {
      list.add("dashboard");
    }
    return Array.from(list);
  }

  return {
    ensureSectionWarm,
    dynamicPreloadsForRoute,
    ensureAssetHandlerVersion,
  };
})();