// scripts/buildAll.mjs
import { execSync } from "node:child_process";

const cmds = [
  "npm run build:lazy", // dist-lazy
  "npm run build:eager", // dist-eager-all
  "npm run build:eager:auth", // dist-eager-auth
  "npm run build:eager:dashboard", // dist-eager-dashboard
  "npm run build:eager:profile", // dist-eager-profile
  "npm run build:eager:discover", // dist-eager-discover
  "npm run build:eager:shop", // dist-eager-shop
];

for (const c of cmds) {
  console.log(`\n>>> ${c}\n`);
  execSync(c, { stdio: "inherit" });
}
console.log("\nAll builds completed.\n");
