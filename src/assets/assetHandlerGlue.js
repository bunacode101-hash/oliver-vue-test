import AssetHandler from "@/assets/AssetHandlerNew";

// Example global config
const assetsConfig = [
  {
    url: "/css/dashboard.css",
    flags: ["dashboard", "/dashboard"],
    priority: "critical",
  }, // Flag for section and route
  { url: "/js/vendor-charts.js", flags: ["dashboard"], priority: "high" },
  {
    url: "/img/above-the-fold-hero.jpg",
    flags: ["dashboard"],
    priority: "normal",
  },
  { url: "/css/auth.css", flags: ["auth"], priority: "critical" }, // Example for auth section
  // Add more for other sections/routes, e.g., profile, discover, shop
];

const handler = new AssetHandler(assetsConfig); // Pass config

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
  } catch {}
}

export default handler;
