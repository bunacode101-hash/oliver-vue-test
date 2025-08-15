class AssetHandler {
  constructor(assetsConfig = []) {
    this.assetsConfig = assetsConfig; // Array of { url, flags: [], priority: 'critical'|'high'|'normal' }
    this.globalVersion = null;
    this.preloaded = new Set();
  }

  setGlobalVersion(version) {
    console.log(
      `[ASSET_VERSION_SET] Setting global version for asset URLs to "${version}". This will append ?ver=${version} to asset URLs for cache busting.`
    );
    this.globalVersion = version;
  }

  // Helper to version URLs
  getVersionedUrl(url) {
    const versioned = this.globalVersion
      ? `${url}?ver=${this.globalVersion}`
      : url;
    console.log(
      `[ASSET_VERSIONED] Generated versioned URL for "${url}": "${versioned}"`
    );
    return versioned;
  }

  // Estimate asset size via fetch (for logging purposes)
  async getAssetSize(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      const sizeBytes = response.headers.get('content-length') || 0;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
      return parseFloat(sizeMB);
    } catch (e) {
      console.error(`[ASSET_SIZE_ERROR] Failed to fetch size for "${url}":`, e);
      return 0;
    }
  }

  // Preload assets matching flags, sorted by priority
  async preloadAssetsByFlag(...flags) {
    const startTime = performance.now();
    console.log(
      `[SECTION_ASSETS_PRELOAD_START] Starting to preload assets matching flags: [${flags.join(", ")}]. Filtering assetsConfig for matches.`
    );
    const matchingAssets = this.assetsConfig.filter((asset) =>
      flags.some((flag) => asset.flags.includes(flag))
    );

    if (matchingAssets.length === 0) {
      console.log(
        `[PRELOAD_FLAGS_NONE] No assets found matching the provided flags: [${flags.join(", ")}]. Skipping preload.`
      );
      return;
    }

    console.log(
      `[PRELOAD_FLAGS_FOUND] Found ${matchingAssets.length} matching assets. Sorting by priority (critical > high > normal).`
    );
    // Sort by priority: critical > high > normal
    matchingAssets.sort((a, b) => {
      const priorities = { critical: 0, high: 1, normal: 2 };
      return priorities[a.priority] - priorities[b.priority];
    });

    for (const asset of matchingAssets) {
      const versionedUrl = this.getVersionedUrl(asset.url);
      if (this.preloaded.has(versionedUrl)) {
        console.log(
          `[ASSET_SKIP] Asset "${versionedUrl}" (priority: ${asset.priority}, flags: [${asset.flags.join(", ")}]) is already preloaded. Skipping to avoid duplication.`
        );
        continue;
      }

      const assetStartTime = performance.now();
      const sizeMB = await this.getAssetSize(versionedUrl);
      console.log(
        `[ASSET_SIZE] "${versionedUrl}" (${sizeMB}MB) - ${sizeMB > 5 ? 'HEAVY' : 'normal'}`
      );
      console.log(
        `[ASSET_PRELOAD] Preloading asset "${versionedUrl}" (priority: ${asset.priority}, flags: [${asset.flags.join(", ")}]). Determining preload method based on file type.`
      );
      if (asset.url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(
          `[ASSET_CSS] Preloaded CSS asset using <link rel="preload" as="style">: "${versionedUrl}"`
        );
      } else if (asset.url.endsWith(".js")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = versionedUrl;
        document.head.appendChild(link);
        console.log(
          `[ASSET_JS] Preloaded JS asset using <link rel="preload" as="script">: "${versionedUrl}"`
        );
      } else {
        // For images/media, use fetch or img preload
        fetch(versionedUrl, { mode: "no-cors" });
        console.log(
          `[HEAVY_ASSET_PRELOAD] Preloaded heavy asset (e.g., image) using fetch (no-cors): "${versionedUrl}"`
        );
      }

      this.preloaded.add(versionedUrl);
      console.log(
        `[ASSET_PRELOAD_DURATION] Preloading asset "${versionedUrl}" took ${performance.now() - assetStartTime}ms`
      );
    }
    console.log(
      `[SECTION_ASSETS_PRELOAD_DONE] Completed preloading assets for flags: [${flags.join(", ")}]. Total duration: ${performance.now() - startTime}ms`
    );
  }
}

export default AssetHandler;