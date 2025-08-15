import AssetHandler from "@/assets/AssetHandlerNew"; 

const handler = new AssetHandler([]);

let versionSet = false;
export function setAssetsVersionOnce(v) {
  if (!versionSet) {
    try {
      handler.setGlobalVersion(v);
    } catch {}
    versionSet = true;
  }
}

export function preloadByFlags(flags) {
  if (!Array.isArray(flags) || flags.length === 0) return;
  try {
    handler.preloadAssetsByFlag(...flags);
  } catch (e) {
    console.error("Asset preload error:", e);
  }
}

export default handler;
