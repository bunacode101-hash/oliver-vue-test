import { useSectionsStore } from "@/stores/sections";
import routesJson from "@/router/routeConfig.json";
import { lazy } from "@/utils/lazy";
import { useAuthStore } from "@/stores/useAuthStore";

let bundlesManifest = null;
const appVersion = import.meta.env.VITE_APP_VERSION || "dev";
const preloadedAssets = new Set();

function preloadAsset(url) {
  if (!url) {
    console.warn("[PRELOAD] Skipping invalid asset URL:", url);
    return Promise.resolve();
  }
  if (preloadedAssets.has(url)) {
    console.log(`[PRELOAD] Asset already preloaded: ${url}`);
    return Promise.resolve();
  }
  preloadedAssets.add(url);

  console.log(`[PRELOAD] Initiating preload for asset: ${url}`);
  return new Promise((resolve, reject) => {
    const ext = url.split(".").pop().toLowerCase();
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;

    if (["js", "mjs"].includes(ext)) {
      link.as = "script";
    } else if (ext === "css") {
      link.as = "style";
    } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
      link.as = "image";
    } else {
      link.as = "fetch";
      link.crossorigin = "anonymous";
    }

    link.onload = () => {
      console.log(`[PRELOAD] Asset loaded successfully: ${url}`);
      resolve();
    };
    link.onerror = () => {
      console.error(`[PRELOAD] Failed to preload asset: ${url}`);
      reject(new Error(`Failed to preload asset: ${url}`));
    };
    document.head.appendChild(link);

    // For images, ensure they are cached without inserting into DOM
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
      const img = new Image();
      img.src = url;
      img.onload = () => console.log(`[PRELOAD] Image cached: ${url}`);
      img.onerror = () =>
        console.error(`[PRELOAD] Failed to cache image: ${url}`);
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
    console.error(
      `[MANIFEST] Failed to load section-bundles.json: ${e.message}`
    );
    return {};
  }
}

export function isSectionActivated(section) {
  const store = useSectionsStore();
  if (store.isActivated(section)) {
    console.log(`[CACHE_HIT] Section "${section}" is already preloaded.`);
    return true;
  }
  console.log(`[CACHE] Section "${section}" not preloaded yet.`);
  return false;
}

export async function activateSection(section) {
  const startTime = performance.now();
  const store = useSectionsStore();
  if (store.isActivated(section)) {
    console.log(
      `[CACHE_HIT] Section "${section}" already activated. Skipping preload.`
    );
    return true;
  }

  console.log(`[PRELOAD] Starting activation for section "${section}"`);

  // Load section bundle
  const manifest = await loadManifest();
  const url = manifest[section];
  if (url) {
    const importUrl = import.meta.env.DEV
      ? url.replace("/assets/", "/public/assets/")
      : url;
    const versionedUrl = `${importUrl}?ver=${appVersion}`;
    console.log(
      `[PRELOAD] Preloading section bundle "${section}" from: ${versionedUrl}`
    );
    try {
      await import(/* @vite-ignore */ versionedUrl);
      console.log(`[DONE] Section "${section}" bundle loaded successfully.`);
      console.log(`[ASSET_DOWNLOADED] ${versionedUrl}`);
    } catch (e) {
      console.error(
        `[ERROR] Failed to preload section bundle "${section}": ${e.message}`
      );
      return false;
    }
  } else {
    console.warn(`[ERROR] No bundle found for section "${section}".`);
  }

  // Collect and preload component-specific assets
  const routesInSection = routesJson.filter((r) => r.section === section);
  const allAssets = { critical: new Set(), high: new Set(), normal: new Set() };
  const auth = useAuthStore();
  const role = auth.simulate?.role || auth.currentUser?.role || "creator";

  const componentPromises = [];
  for (const route of routesInSection) {
    console.log(
      `[PRELOAD] Processing route "${route.slug}" in section "${section}"`
    );
    let compPath = route.componentPath;
    if (route.customComponentPath) {
      compPath = route.customComponentPath[role]?.componentPath;
    }
    if (!compPath) {
      console.warn(`[PRELOAD] No component path for route "${route.slug}"`);
      continue;
    }

    console.log(`[PRELOAD] Loading component for "${route.slug}": ${compPath}`);
    componentPromises.push(
      lazy(compPath)()
        .then((compModule) => {
          console.log(`[PRELOAD] Component loaded for "${route.slug}"`);
          const assets = compModule.assets || {};
          console.log(
            `[ASSET] Assets declared for "${route.slug}":`,
            JSON.stringify(assets)
          );
          ["critical", "high", "normal"].forEach((prio) => {
            (assets[prio] || []).forEach((url) => {
              allAssets[prio].add(url);
              console.log(
                `[ASSET] Queued ${prio} asset for "${route.slug}": ${url}`
              );
            });
          });
          return compModule;
        })
        .catch((e) => {
          console.error(
            `[ERROR] Failed to load component for "${route.slug}": ${e.message}`
          );
          return null;
        })
    );
  }

  // Wait for all components to load
  await Promise.all(componentPromises);

  // Wait for DOM to be fully loaded
  await new Promise((resolve) => {
    if (document.readyState === "complete") {
      console.log(
        "[DOM] Document already fully loaded, proceeding with asset preload"
      );
      resolve();
    } else {
      window.addEventListener(
        "load",
        () => {
          console.log(
            "[DOM] Document fully loaded, proceeding with asset preload"
          );
          resolve();
        },
        { once: true }
      );
    }
  });

  // Preload assets in priority order
  const assetPromises = [];
  ["critical", "high", "normal"].forEach((prio) => {
    allAssets[prio].forEach((url) => {
      console.log(`[ASSET] Preloading ${prio} asset: ${url}`);
      assetPromises.push(preloadAsset(url));
    });
  });

  // Wait for all assets to preload
  await Promise.allSettled(assetPromises).then((results) => {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`[ASSET] Failed to preload asset: ${result.reason}`);
      }
    });
  });

  store.markActivated(section);
  console.log(
    `[DONE] All assets for section "${section}" downloaded and cached.`
  );
  console.log(`[Callback] Assets and route completed for "${section}"`);

  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`[DONE] Preload "${section}" completed in ${duration}ms.`);

  return true;
}
