import AssetHandler from "@/assets/AssetHandlerNew";

// singleton
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

/**
 * Preload by flags with basic guardrails.
 */
export function preloadByFlags(flags) {
  if (!Array.isArray(flags) || flags.length === 0) return;
  try {
    handler.preloadAssetsByFlag(...flags);
  } catch {}
}

export default handler;
