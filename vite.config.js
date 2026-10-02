import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Precache the exact assets of each release, including vendor chunks.
function offlineAssets() {
  let assets = [];
  let outDir;
  return {
    name: "offline-assets",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      assets = Object.keys(bundle)
        .filter((p) => p.startsWith("assets/"))
        .map((p) => "/" + p);
    },
    closeBundle() {
      const path = resolve(outDir, "sw.js");
      writeFileSync(
        path,
        readFileSync(path, "utf8")
          .replace(
            'const CACHE = "bgh-v9";',
            `const CACHE = "bgh-${createHash("sha256").update(JSON.stringify(assets)).digest("hex").slice(0, 12)}";`,
          )
          .replace(
            "const BUILT_ASSETS = [];",
            `const BUILT_ASSETS = ${JSON.stringify(assets)};`,
          ),
      );
    },
  };
}
export default defineConfig({
  plugins: [react(), offlineAssets()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "dice-renderer": ["three"],
          "dice-physics": ["cannon-es"],
          cloud: ["@supabase/supabase-js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
