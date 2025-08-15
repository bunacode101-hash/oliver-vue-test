import AssetHandler from "@/assets/AssetHandlerNew";

const handler = new AssetHandler([]);

let versionSet = false;
export function setAssetsVersionOnce(v) {
  if (!versionSet) {
    console.log(
      `[ASSET_VERSION_ONCE] Setting assets version once to "${v}". This ensures version is set only on first call.`
    );
    try {
      handler.setGlobalVersion(v);
      console.log(
        `[ASSET_VERSION_SUCCESS] Assets version successfully set to "${v}".`
      );
    } catch (e) {
      console.error(
        `[ASSET_VERSION_ERROR] Error occurred while trying to set assets version to "${v}":`,
        e
      );
    }
    versionSet = true;
  } else {
    console.log(
      `[ASSET_VERSION_SKIP] Assets version already set. Skipping duplicate set to "${v}".`
    );
  }
}

export function preloadByFlags(flags) {
  if (!Array.isArray(flags) || flags.length === 0) {
    console.log(
      `[PRELOAD_FLAGS_INVALID] Invalid flags provided for preloading: ${
        flags ? "empty array" : "not an array"
      }. Skipping preload.`
    );
    return;
  }
  console.log(
    `[PRELOAD_FLAGS_REQUEST] Request to preload assets by flags: [${flags.join(
      ", "
    )}]`
  );
  try {
    handler.preloadAssetsByFlag(...flags);
    console.log(
      `[PRELOAD_FLAGS_SUCCESS] Preload by flags completed successfully for [${flags.join(
        ", "
      )}]`
    );
  } catch (e) {
    console.error(
      `[PRELOAD_FLAGS_ERROR] Error occurred during asset preload by flags [${flags.join(
        ", "
      )}]:`,
      e
    );
  }
}

export default handler;