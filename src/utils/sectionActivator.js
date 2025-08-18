import { useSectionsStore } from "@/stores/sections";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { useAuthStore } from "@/stores/useAuthStore";

let bundlesManifest = null;
const appVersion = import.meta.env.VITE_APP_VERSION || "dev";
export const preloadedAssets = new Set(); // Expose for debug commands

function preloadAsset(url) {
  if (!url) {
    console.warn("[PRELOAD] Skipping invalid asset URL:", url);
    return Promise.resolve();
  }
  if (preloadedAssets.has(url)) {
    console.log(`[CACHE] Asset already loaded, skipping: ${url}`);
    return Promise.resolve();
  }
  preloadedAssets.add(url);

  console.log(`[PRELOAD] Loading image: ${url}`);
  return new Promise((resolve, reject) => {
    const ext = url.split('.').pop().toLowerCase();
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    if (['js', 'mjs'].includes(ext)) {
      link.as = 'script';
    } else if (ext === 'css') {
      link.as = 'style';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      link.as = 'image';
    } else {
      link.as = 'fetch';
      link.crossorigin = 'anonymous';
    }

    link.onload = () => {
      console.log(`[ASSET_DOWNLOADED] Image loaded: ${url}`);
      resolve();
    };
    link.onerror = () => {
      console.error(`[ERROR] Failed to preload asset: ${url}`);
      reject(new Error(`Failed to preload asset: ${url}`));
    };
    document.head.appendChild(link);

    if (ext === 'css') {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = url;
      styleLink.onload = () => console.log(`[ASSET_APPLIED] Stylesheet applied: ${url}`);
      styleLink.onerror = () => console.error(`[ASSET_APPLIED] Failed to apply stylesheet: ${url}`);
      document.head.appendChild(styleLink);
    } else if (['js', 'mjs'].includes(ext)) {
      const script = document.createElement('script');
      script.src = url;
      script.defer = true;
      script.onload = () => console.log(`[ASSET_APPLIED] Script executed: ${url}`);
      script.onerror = () => console.error(`[ASSET_APPLIED] Failed to load script: ${url}`);
      document.head.appendChild(script);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      const img = new Image();
      img.src = url;
      img.onload = () => console.log(`[ASSET_APPLIED] Image loaded into DOM: ${url}`);
      img.onerror = () => console.error(`[ASSET_APPLIED] Failed to load image: ${url}`);
    }
  });
}

async function loadManifest() {
  if (bundlesManifest) {
    console.log("[MANIFEST] Using cached manifest");
    return bundlesManifest;
  }

  try {
    const manifestPath = import.meta.env.DEV
      ? "/public/section-bundles.json"
      : "/section-bundles.json";
    console.log(`[MANIFEST] Fetching manifest from: ${manifestPath}`);
    const res = await fetch(manifestPath, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bundlesManifest = await res.json();
    console.log("[MANIFEST] Manifest loaded successfully");
    return bundlesManifest;
  } catch (e) {
    console.error(`[MANIFEST] Failed to load section-bundles.json: ${e.message}`);
    return {};
  }
}

export function isSectionActivated(section) {
  const store = useSectionsStore();
  if (store.isActivated(section)) {
    console.log(`[CACHE] Section "${section}" already cached`);
    return true;
  }
  console.log(`[CACHE] Section "${section}" not cached yet — will need to preload/lazy load.`);
  return false;
}

export async function activateSection(section) {
  const startTime = performance.now();
  const store = useSectionsStore();
  if (store.isActivated(section)) {
    console.log(`[CACHE] Section "${section}" already cached`);
    return true;
  }

  console.log(`[SECTION] Activating section: ${section}`);
  performance.mark('section-start');

  // Load section bundle
  const manifest = await loadManifest();
  const url = manifest[section];
  if (url) {
    const importUrl = import.meta.env.DEV ? url.replace("/assets/", "/public/assets/") : url;
    const versionedUrl = `${importUrl}?ver=${appVersion}`;
    console.log(`[SECTION] Preloading section bundle "${section}" from: ${versionedUrl}`);
    try {
      await import(/* @vite-ignore */ versionedUrl);
      console.log(`[SECTION] Section "${section}" bundle loaded successfully.`);
      console.log(`[ASSET_DOWNLOADED] ${versionedUrl}`);
    } catch (e) {
      console.error(`[ERROR] Failed to preload section bundle "${section}": ${e.message}`);
      return false;
    }
  } else {
    console.warn(`[ERROR] No bundle found for section "${section}".`);
  }

  // Collect and preload component-specific assets
  const routesInSection = routesJson.filter(r => r.section === section);
  const allAssets = { critical: new Set(), high: new Set(), normal: new Set() };
  const auth = useAuthStore();
  const role = auth.simulate?.role || auth.currentUser?.role || "creator";

  const componentPromises = [];
  for (const route of routesInSection) {
    console.log(`[PRELOAD] Processing route "${route.slug}" in section "${section}"`);
    let compPath = route.componentPath;
    if (route.customComponentPath) {
      compPath = route.customComponentPath[role]?.componentPath;
    }
    if (!compPath) {
      console.warn(`[PRELOAD] No component path for route "${route.slug}"`);
      continue;
    }

    console.log(`[COMPONENT] Loading component: ${route.slug}`);
    componentPromises.push(
      lazy(compPath)()
        .then((compModule) => {
          console.log(`[COMPONENT] Component loaded: ${route.slug}`);
          const assets = compModule.assets || {};
          console.log(`[ASSET] Component has ${Object.values(assets).flat().length} images to preload`);
          ['critical', 'high', 'normal'].forEach(prio => {
            (assets[prio] || []).forEach(url => {
              if (!preloadedAssets.has(url)) {
                allAssets[prio].add(url);
                console.log(`[ASSET] Queued ${prio} asset for "${route.slug}": ${url}`);
              } else {
                console.log(`[CACHE] Asset already loaded, skipping: ${url}`);
              }
            });
          });
          return compModule;
        })
        .catch((e) => {
          console.error(`[ERROR] Failed to load component for "${route.slug}": ${e.message}`);
          return null;
        })
    );
  }

  // Wait for all components to load
  await Promise.all(componentPromises);

  // Wait for DOM to be fully loaded
  console.log("[DOM] Waiting for DOM to be ready...");
  await new Promise(resolve => {
    if (document.readyState === 'complete') {
      console.log("[DOM] DOM is ready, proceeding with section activation");
      performance.mark('dom-ready');
      resolve();
    } else {
      window.addEventListener('load', () => {
        console.log("[DOM] DOM is ready, proceeding with section activation");
        performance.mark('dom-ready');
        resolve();
      }, { once: true });
    }
  });

  // Preload assets in priority order
  performance.mark('preload-start');
  const assetPromises = [];
  ['critical', 'high', 'normal'].forEach(prio => {
    allAssets[prio].forEach(url => {
      console.log(`[ASSET] Preloading ${prio} asset: ${url}`);
      assetPromises.push(preloadAsset(url));
    });
  });

  // Wait for all assets to preload
  await Promise.allSettled(assetPromises).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[ERROR] Failed to preload asset: ${result.reason}`);
      }
    });
  });

  store.markActivated(section);
  console.log(`[SECTION] Section ${section} activated in ${(performance.now() - startTime).toFixed(2)}ms.`);
  console.log(`[Callback] Assets and route completed for "${section}"`);

  return true;
}