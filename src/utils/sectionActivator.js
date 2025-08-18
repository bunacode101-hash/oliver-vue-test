// utils/sectionActivator.js
export const preloadedAssets = new Map();
export const appliedAssets = new Set();

export function preloadAsset(url, apply = false) {
  if (!url) return Promise.resolve();

  if (apply && appliedAssets.has(url)) {
    console.log(`[Loader] Already loaded; skipping: ${url}`);
    return Promise.resolve();
  }

  const ext = url.split(".").pop().toLowerCase();
  let preloadPromise = preloadedAssets.get(url);

  if (!preloadPromise) {
    preloadPromise = new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = url;

      if (["js", "mjs"].includes(ext)) {
        link.as = "script";
      } else if (ext === "css") {
        link.as = "style";
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        link.as = "image";
      }

      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    }).catch((err) => {
      console.error(`Failed to preload ${url}`, err);
      preloadedAssets.delete(url);
      throw err;
    });
    preloadedAssets.set(url, preloadPromise);
  }

  if (!apply) return preloadPromise;

  // For apply=true, wait for preload, then apply
  return preloadPromise
    .then(() => {
      let applyPromise;
      if (ext === "css") {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = url;
        document.head.appendChild(style);
        applyPromise = new Promise((res, rej) => {
          style.onload = res;
          style.onerror = rej;
        });
      } else if (["js", "mjs"].includes(ext)) {
        const script = document.createElement("script");
        script.src = url;
        script.defer = true;
        document.head.appendChild(script);
        applyPromise = new Promise((res, rej) => {
          script.onload = res;
          script.onerror = rej;
        });
      } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
        const img = new Image();
        img.src = url;
        applyPromise = new Promise((res, rej) => {
          img.onload = res;
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
      console.error(`Failed to apply ${url}`, err);
      throw err;
    });
}
