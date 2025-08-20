import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import fs from "fs-extra";
import { join } from "path";

async function generateManifest() {
  const outputDir = join(__dirname, "dist/assets");
  const distDir = join(__dirname, "dist");
  const bundles = {};

  await fs.ensureDir(distDir);

  if (!(await fs.exists(outputDir))) {
    console.log(
      "[MANIFEST_SKIP] Assets directory not found, creating empty manifest."
    );
    await fs.writeJson(join(distDir, "section-bundles.json"), bundles);
    return;
  }

  const files = await fs.readdir(outputDir);
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    if (file.startsWith("section-auth")) bundles["auth"] = `/assets/${file}`;
    if (file.startsWith("section-dashboard"))
      bundles["dashboard"] = `/assets/${file}`;
    if (file.startsWith("section-profile"))
      bundles["profile"] = `/assets/${file}`;
    if (file.startsWith("section-discover"))
      bundles["discover"] = `/assets/${file}`;
    if (file.startsWith("section-shop")) bundles["shop"] = `/assets/${file}`;
    if (file.startsWith("section-misc")) bundles["misc"] = `/assets/${file}`;
  });

  await fs.writeJson(join(distDir, "section-bundles.json"), bundles);
  console.log(
    "[MANIFEST_GENERATED] section-bundles.json created successfully."
  );
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [vue(), vueDevTools()],
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        buffer: "buffer",
      },
    },
    publicDir: "public",
    test: {
      environment: "jsdom",
      globals: true,
    },
    build: {
      sourcemap: true,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/components/auth/")) return "section-auth";
            if (id.includes("/components/dashboard/"))
              return "section-dashboard";
            if (id.includes("/components/profile/")) return "section-profile";
            if (id.includes("/components/discover/")) return "section-discover";
            if (id.includes("/components/shop/")) return "section-shop";
            if (id.includes("/components/NotFound.vue")) return "section-misc";
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
        plugins: [
          {
            name: "generate-manifest",
            async closeBundle() {
              await generateManifest();
            },
          },
        ],
      },
    },
  };
});
