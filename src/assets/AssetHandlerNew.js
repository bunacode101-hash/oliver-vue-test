// src/assets/AssetHandlerNew.js
// Basic AssetHandler class (expand with your logic for priorities, throttling, deduping, etc.)

class AssetHandler {
  constructor(assetsConfig = []) {
    this.assetsConfig = assetsConfig; // Array of { url, flags: [], priority: 'critical'|'high'|'normal' }
    this.globalVersion = null;
    this.preloaded = new Set();
  }

  setGlobalVersion(version) {
    this.globalVersion = version;
  }

  // Helper to version URLs
  getVersionedUrl(url) {
    return this.globalVersion ? `${url}?ver=${this.globalVersion}` : url;
  }

  // Preload assets matching flags, sorted by priority
  preloadAssetsByFlag(...flags) {
    const matchingAssets = this.assetsConfig.filter((asset) =>
      flags.some((flag) => asset.flags.includes(flag))
    );

    // Sort by priority: critical > high > normal
    matchingAssets.sort((a, b) => {
      const priorities = { critical: 0, high: 1, normal: 2 };
      return priorities[a.priority] - priorities[b.priority];
    });

    matchingAssets.forEach((asset) => {
      const versionedUrl = this.getVersionedUrl(asset.url);
      if (this.preloaded.has(versionedUrl)) return; // Dedupe

      // Preload logic (e.g., add <link rel="preload"> or fetch)
      if (asset.url.endsWith(".css")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else if (asset.url.endsWith(".js")) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = versionedUrl;
        document.head.appendChild(link);
      } else {
        // For images/media, use fetch or img preload
        fetch(versionedUrl, { mode: "no-cors" });
      }

      this.preloaded.add(versionedUrl);
      console.log(`Preloaded: ${versionedUrl}`); // For debugging
    });
  }
}

export default AssetHandler;
