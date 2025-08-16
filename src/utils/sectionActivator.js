let bundlesManifest = null;
const activated = Object.create(null);

async function loadManifest() {
  if (bundlesManifest) {
    return bundlesManifest;
  }

  try {
    const manifestPath = import.meta.env.DEV
      ? "/public/section-bundles.json"
      : "/section-bundles.json";
    const res = await fetch(manifestPath, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bundlesManifest = await res.json();
    return bundlesManifest;
  } catch (e) {
    console.log(`[LOAD] Failed to load section-bundles.json: ${e.message}`);
    return {};
  }
}

export async function isSectionActivated(section) {
  if (activated[section]) {
    console.log(`[CACHE_HIT] Section "${section}" is already preloaded.`);
    return true;
  }

  return false;
}

export async function activateSection(section) {
  if (activated[section]) {
    console.log(
      `[CACHE_HIT] Section "${section}" already activated. Skipping preload.`
    );
    return true;
  }

  const manifest = await loadManifest();
  const url = manifest[section];
  if (!url) {
    console.log(`[ERROR] No bundle found for section "${section}".`);
    return false;
  }

  const startTime = performance.now();
  console.log(
    `[PRELOAD] Preloading compiled section "${section}" from: ${url}`
  );

  try {
    const importUrl = import.meta.env.DEV
      ? url.replace("/assets/", "/public/assets/")
      : url;
    await import(/* @vite-ignore */ importUrl);

    activated[section] = true;
    console.log(
      `[DONE] Route "${section}" loaded successfully (lazy load complete).`
    );
    console.log(`[DONE] All assets for section "${section}" downloaded.`);
    console.log(`[Callback] Assets and route completed`);

    const duration = (performance.now() - startTime).toFixed(2);
    console.log(
      `[DONE] Preload "${section}" Assets and section "${section}" cached (took ${duration}ms).`
    );

    return true;
  } catch (e) {
    console.log(`[ERROR] Failed to preload section "${section}": ${e.message}`);
    return false;
  }
}
