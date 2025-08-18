// utils/sectionActivator.js
const preloadedAssets = new Map(); // url -> Promise

export function preloadAsset(url) {
  if (!url) {
    console.warn("[PRELOAD] Skipping invalid asset URL:", url);
    return Promise.resolve();
  }

  // Dedupe: if there's already an in-flight or completed promise, return it.
  if (preloadedAssets.has(url)) {
    return preloadedAssets.get(url);
  }

  console.log(`[PRELOAD] Starting preload for: ${url}`);

  const ext = url.split(".").pop().toLowerCase();

  const promise = new Promise((resolve, reject) => {
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
      link.crossOrigin = "anonymous";
    }

    link.onload = () => {
      console.log(`[ASSET_DOWNLOADED] Asset downloaded (preload complete): ${url}`);
      try {
        applyAsset(url, ext);
      } catch (err) {
        console.error(`[ERROR] applyAsset threw for ${url}:`, err);
      }
      resolve();
    };

    link.onerror = (e) => {
      console.error(`[ERROR] Failed to preload asset: ${url}`, e);
      reject(new Error(`Failed to preload asset: ${url}`));
    };

    // Append preload link to head (browser will fetch it)
    document.head.appendChild(link);
  });

  // Store the in-flight promise so concurrent requests dedupe
  preloadedAssets.set(url, promise);

  // If the promise rejects, remove it from map so retries are possible later
  promise.catch(() => {
    preloadedAssets.delete(url);
  });

  return promise;
}

function applyAsset(url, ext) {
  if (ext === "css") {
    // create real stylesheet link (applying CSS)
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = url;
    styleLink.onload = () => console.log(`[ASSET_APPLIED] Stylesheet applied: ${url}`);
    styleLink.onerror = () => console.error(`[ASSET_APPLIED] Failed to apply stylesheet: ${url}`);
    document.head.appendChild(styleLink);
  } else if (["js", "mjs"].includes(ext)) {
    // create script tag to run it
    const script = document.createElement("script");
    script.src = url;
    script.defer = true;
    script.onload = () => console.log(`[ASSET_APPLIED] Script executed: ${url}`);
    script.onerror = () => console.error(`[ASSET_APPLIED] Failed to execute script: ${url}`);
    document.head.appendChild(script);
  } else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
    // create image object to ensure it's cached/decoded
    const img = new Image();
    img.src = url;
    img.onload = () => console.log(`[ASSET_APPLIED] Image loaded into DOM: ${url}`);
    img.onerror = () => console.error(`[ASSET_APPLIED] Failed to load image: ${url}`);
  } else {
    console.log(`[ASSET_APPLIED] No specific apply behavior for extension "${ext}" for ${url}`);
  }
}
