import { useSectionPreloadCache } from "@/stores/sectionCache";
import { preloadByFlags, setAssetsVersionOnce } from "@/assets/assetHandlerGlue";
import routesJson from "@/router/routeConfig.json";

function getVersion() {
  const version = import.meta.env?.VITE_APP_VERSION ?? "dev";
  console.log(`[VERSION_GET] Retrieved app version from environment: "${version}"`);
  return version;
}

function collectDeclaredAssets(componentModule) {
  console.log(`[ASSETS_COLLECT_START] Collecting declared assets from component module.`);
  const mod = componentModule;
  const comp = mod?.default ?? mod;
  const a = mod?.assets || comp?.assets || {};
  const norm = (arr) => (Array.isArray(arr) ? arr.filter(Boolean) : []);
  const collected = {
    critical: norm(a.critical),
    high: norm(a.high),
    normal: norm(a.normal),
  };
  console.log(`[ASSETS_COLLECT_DONE] Collected declared assets: critical [${collected.critical.join(', ') || 'none'}], high [${collected.high.join(', ') || 'none'}], normal [${collected.normal.join(', ') || 'none'}]`);
  return collected;
}

function flagsFor(section, routePath) {
  const list = new Set();
  if (section) list.add(section);
  if (routePath) list.add(routePath);
  const flags = Array.from(list);
  console.log(`[FLAGS_GENERATE] Generated flags for section "${section}" and route "${routePath}": [${flags.join(', ') || 'none'}]`);
  return flags;
}

const preloaded = new Set();
function preloadDeclaredAssets(assets, version, section) {
  const startTime = performance.now();
  console.log(`[SECTION_ASSETS_PRELOAD_START] Starting to preload declared assets for section "${section}". Version: "${version}". Assets:`, assets);
  const priorities = ["critical", "high", "normal"];
  const cachedAssets = [];
  priorities.forEach((priority) => {
    assets[priority].forEach((url) => {
      const versionedUrl = version ? `${url}?ver=${version}` : url;
      if (preloaded.has(versionedUrl)) {
        console.log(`[ASSET_SKIP] Skipping preload for already preloaded ${priority.toUpperCase()} asset in section "${section}": "${versionedUrl}"`);
        return;
      }
      const assetStartTime = performance.now();
      console.log(`[ASSET] (${priority.toUpperCase()}) for section "${section}": "${versionedUrl}"`);
      if (url.endsWith(".css") && priority === "critical") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(`[ASSET_CSS_CRITICAL] Loaded critical CSS as stylesheet for section "${section}": "${versionedUrl}"`);
      } else if (url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(`[ASSET_CSS] Preloaded CSS for section "${section}": "${versionedUrl}"`);
      } else if (url.endsWith(".js")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(`[ASSET_JS] Preloaded JS for section "${section}": "${versionedUrl}"`);
      } else {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(`[HEAVY_ASSET_PRELOAD] Preloaded heavy image/asset for section "${section}" using <link rel="preload" as="image">: "${versionedUrl}" (this caches heavy images/icons for instant load later)`);
      }
      preloaded.add(versionedUrl);
      cachedAssets.push(versionedUrl);
      console.log(`[ASSET_PRELOAD_DURATION] Preloading asset "${versionedUrl}" took ${performance.now() - assetStartTime}ms`);
    });
  });
  console.log(`[SECTION_ASSETS_PRELOAD_DONE] Completed preloading declared assets for section "${section}". Total duration: ${performance.now() - startTime}ms`);
  return cachedAssets;
}

export const SectionPrefetcher = (() => {
  const preloadedSectionModules = new Map();
  const pendingPreloads = new Map();
  let bootVersionSet = false;

  function ensureAssetHandlerVersion() {
    if (bootVersionSet) {
      console.log(`[ASSET_BOOT_SKIP] Asset handler version already set during boot. Skipping.`);
      return;
    }
    const v = getVersion();
    console.log(`[ASSET_BOOT_SET] Setting asset handler version during boot to "${v}"`);
    setAssetsVersionOnce(v);
    bootVersionSet = true;
    console.log(`[ASSET_BOOT_DONE] Boot version set completed.`);
  }

  async function ensureSectionPreloaded(section, routerGetRoutes, currentPath = null) {
    if (!section) {
      console.log(`[ENTRY_ERROR] Attempt to preload section failed: section name is empty or undefined. Skipping.`);
      return;
    }
    const startTime = performance.now();
    console.log(`[ENTRY] Section load request: "${section}"`);
    ensureAssetHandlerVersion();
    const cache = useSectionPreloadCache();
    console.log(`[COMPILE_SECTION_CHECK] Checking if compiled section exists for: "${section}"`);
    if (cache.isSectionPreloaded(section)) {
      console.log(`[CACHED] Preloaded compiled section "${section}" was loaded from cache — skipping preload. Navigation within this section will be instant.`);
      console.log(`[PRELOAD_VERIFY] Verified preloaded section: "${section}" exists=true`);
      return;
    }

    let promise = pendingPreloads.get(section);
    if (promise) {
      console.log(`[PENDING_AWAIT] Section "${section}" has an ongoing preload process. Awaiting existing promise to avoid duplication.`);
      return promise;
    }

    promise = (async () => {
      try {
        console.log(`[PRELOAD_START] No ongoing preload found. Starting preload process for section "${section}".`);
        const allRoutes = routerGetRoutes()
          .filter((rr) => rr.meta?.section === section)
          .map((rr) => ({
            path: rr.path,
            meta: rr.meta,
            component: rr.components?.default || rr.component,
          }));
        if (allRoutes.length === 0) {
          console.log(`[ROUTES_NONE] No routes found for section "${section}". Skipping preload.`);
          return;
        }
        console.log(`[ROUTES] ${allRoutes.length} route(s) in section "${section}": ${allRoutes.map((r) => r.path).join(", ")}`);
        const isCurrentSection = !!currentPath && allRoutes.some((r) => r.path === currentPath);
        console.log(`[LOAD_DECISION] Section "${section}" will be ${isCurrentSection ? "lazy loaded (current route only)" : "compiled loaded (background preloading all routes)"}. Current path: "${currentPath ?? "none"}"`);
        console.log(`[PRELOAD_TYPE] ${isCurrentSection ? `Lazy loading current route "${currentPath}" on-demand. Preloading remaining components/assets for instant future navigation within section.` : `Preloading compiled section "${section}" in background — fetching all routes/components now (anticipated next section).`}`);
        const componentKeys = new Set();
        const allFlags = new Set();
        allFlags.add(section);
        const version = getVersion();
        let allDeclaredAssets = { critical: [], high: [], normal: [] };

        await Promise.allSettled(
          allRoutes.map(async (r) => {
            const loader = r.component;
            if (typeof loader !== "function") {
              console.log(`[COMPONENT_SKIP] Route "${r.path}" in section "${section}" does not have a valid lazy loader function (e.g., () => import(...)). Skipping preload for this route.`);
              console.log(`[SKIP_REASON] Route "${r.path}" skipped: Invalid or missing loader function.`);
              return;
            }
            const key = r.path;
            const isCurrent = currentPath && r.path === currentPath;
            console.log(`[COMPONENT] Loading ${isCurrent ? "lazy" : "background compiled"} component for route "${r.path}"`);
            if (cache.preloadedComponents[key]) {
              console.log(`[COMPONENT_CACHED] Route "${r.path}" in section "${section}" component is already preloaded/marked in cache (possibly from previous lazy load). Skipping module reload; using cached version.`);
              console.log(`[SKIP_REASON] Route "${r.path}" skipped: Already preloaded in cache.`);
              return;
            }
            const componentStartTime = performance.now();
            try {
              const mod = await loader();
              console.log(`[COMPILED_SECTION_LOADED] Successfully loaded module for route "${r.path}" in section "${section}". ${isCurrent ? "Loaded on-demand (may have slight delay if not cached; instant if previously visited)." : "Preloaded in background for future instant load."} ${cache.preloadedComponents[key] ? "(From lazy load cache)" : "(Fresh load)"}`);
              const compKey = mod?.__file || mod?.default?.__file || mod?.default?.name || key;
              if (compKey) {
                cache.markComponentPreloaded(compKey);
                componentKeys.add(compKey);
                console.log(`[COMPILED_SECTION_LOADED] Marked component "${compKey}" as preloaded for route "${r.path}".`);
              }
              flagsFor(section, r.path).forEach((f) => allFlags.add(f));
              const declared = collectDeclaredAssets(mod);
              Object.keys(declared).forEach((p) => {
                allDeclaredAssets[p] = [...new Set([...allDeclaredAssets[p], ...declared[p]])]; // Dedupe
              });
              console.log(`[ASSETS_MERGED] Collected and merged declared assets for route "${r.path}" in section "${section}".`);
              console.log(`[COMPONENT_LOAD_DURATION] Loading component for route "${r.path}" took ${performance.now() - componentStartTime}ms`);
            } catch (e) {
              console.error(`[COMPONENT_ERROR] Error occurred while preloading module for route "${r.path}" in section "${section}":`, e);
              console.log(`[SKIP_REASON] Route "${r.path}" skipped: Failed to load module due to error.`);
            }
          })
        );

        console.log(`[PRELOAD] Preloading all declared assets for section "${section}"...`);
        const cachedAssets = preloadDeclaredAssets(allDeclaredAssets, version, section);
        preloadByFlags(Array.from(allFlags));
        preloadedSectionModules.set(section, componentKeys);
        cache.markSectionPreloaded(section);
        console.log(`[PRELOAD_RESULTS] Section "${section}" cached: ${componentKeys.size} components, ${cachedAssets.length} assets`);
        console.log(`[DONE] Section "${section}" is now fully loaded and cached. Navigation within this section will be instant. Total duration: ${performance.now() - startTime}ms`);
      } finally {
        pendingPreloads.delete(section);
        console.log(`[PRELOAD_RESOLVED] Preload promise for section "${section}" resolved. Removed from pending preloads.`);
      }
    })();

    pendingPreloads.set(section, promise);
    console.log(`[PRELOAD_PROMISE] Started new preload promise for section "${section}" and added to pending.`);
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
    const preloads = Array.from(list);
    console.log(`[DYNAMIC_PRELOADS] Determined dynamic sections to preload for route "${to.path}" with user role "${userRole ?? 'none'}": [${preloads.join(', ') || 'none'}] (these are anticipated next sections based on config)`);
    return preloads;
  }

  return {
    ensureSectionPreloaded,
    dynamicPreloadsForRoute,
    ensureAssetHandlerVersion,
  };
})();