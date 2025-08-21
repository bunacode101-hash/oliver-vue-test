export const preloadedAssets = new Map();
export const appliedAssets = new Set();

function getDomain(url) {
  try {
    const fullUrl = url.startsWith('http') ? url : new URL(url, location.href).href;
    return new URL(fullUrl).hostname;
  } catch {
    return location.hostname;
  }
}

async function limitConcurrency(arr, fn, limit) {
  const running = [];
  const results = [];
  for (const item of arr) {
    if (running.length >= limit) {
      await Promise.race(running);
    }
    const p = fn(item).finally(() => {
      const index = running.indexOf(p);
      if (index !== -1) running.splice(index, 1);
    });
    running.push(p);
    results.push(p);
  }
  return Promise.all(results);
}

export async function isSectionActivated(section) {
  const { useSectionsStore } = await import("@/stores/sectionStore");
  const sectionsStore = useSectionsStore();
  const activated = sectionsStore.isActivated(section);
  if (activated) {
    console.log(`[CACHE_HIT] Section "${section}" is already preloaded.`);
    return true;
  }
  console.log(`[CACHE] Section "${section}" not cached yet.`);
  return false;
}

export async function preloadAssets(urls, apply) {
  if (urls.length === 0) {
    // console.log(`[ASSETS] No assets to ${apply ? 'preload and apply' : 'prefetch'} (apply=${apply})`);
    return;
  }
  // console.log(`[ASSETS] Starting limited ${apply ? 'preload' : 'prefetch'} for ${urls.length} assets (apply=${apply}, limit=5 per domain)`);
  const groups = {};
  urls.forEach((url) => {
    const domain = getDomain(url);
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(url);
  });
  const groupPromises = [];
  for (const domain in groups) {
    // console.log(`[DOMAIN] ${apply ? 'Preloading' : 'Prefetching'} ${groups[domain].length} assets for domain "${domain}": ${groups[domain].join(", ")}`);
    groupPromises.push(limitConcurrency(groups[domain], (url) => preloadAsset(url, apply), 5));
  }
  await Promise.all(groupPromises);
  console.log(`[ASSETS] Completed limited ${apply ? 'preload' : 'prefetch'} for all assets`);
}

export function preloadAsset(url, apply = false) {
  if (!url) {
    console.warn(`[${apply ? 'PRELOAD' : 'PREFETCH'}] Skipping invalid asset URL: ${url}`);
    return Promise.resolve();
  }
  if (apply && appliedAssets.has(url)) {
    // console.log(`[Loader] Already loaded; skipping: ${url}`);
    return Promise.resolve();
  }
  // console.log(`[${apply ? 'PRELOAD' : 'PREFETCH'}] Initiating ${apply ? 'preload' : 'prefetch'} for ${url}`);
  const ext = url.split(".").pop().toLowerCase();
  let preloadPromise = preloadedAssets.get(url);
  if (!preloadPromise) {
    preloadPromise = new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = apply ? "preload" : "prefetch";
      link.href = url;
      if (["js", "mjs"].includes(ext)) {
        link.as = "script";
      } else if (ext === "css") {
        link.as = "style";
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        link.as = "image";
      }
      link.onload = () => {
        // console.log(`[${apply ? 'PRELOAD' : 'PREFETCH'}] Completed ${apply ? 'preload' : 'prefetch'} for ${url}`);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    }).catch((err) => {
      console.error(`[${apply ? 'PRELOAD' : 'PREFETCH'}] Failed to ${apply ? 'preload' : 'prefetch'} ${url}`, err);
      preloadedAssets.delete(url);
      throw err;
    });
    preloadedAssets.set(url, preloadPromise);
  }
  if (!apply) return preloadPromise;
  return preloadPromise
    .then(() => {
      // console.log(`[APPLY] Applying ${url}`);
      let applyPromise;
      if (ext === "css") {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = url;
        document.head.appendChild(style);
        applyPromise = new Promise((res, rej) => {
          style.onload = () => {
            // console.log(`[APPLY] Completed apply for CSS ${url}`);
            res();
          };
          style.onerror = rej;
        });
      } else if (["js", "mjs"].includes(ext)) {
        const script = document.createElement("script");
        script.src = url;
        script.defer = true;
        document.head.appendChild(script);
        applyPromise = new Promise((res, rej) => {
          script.onload = () => {
            // console.log(`[APPLY] Completed apply for JS ${url}`);
            res();
          };
          script.onerror = rej;
        });
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        const img = new Image();
        img.src = url;
        applyPromise = new Promise((res, rej) => {
          img.onload = () => {
            // console.log(`[APPLY] Completed apply for image ${url}`);
            res();
          };
          img.onerror = rej;
        });
      } else {
        applyPromise = Promise.resolve();
      }
      return applyPromise;
    })
    .then(() => {
      appliedAssets.add(url);
    })
    .catch((err) => {
      console.error(`[APPLY] Failed to apply ${url}`, err);
      throw err;
    });
}