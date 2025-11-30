import { defineConfig } from "vite";

export default defineConfig({
  // Base path for GitHub Pages deployment (e.g., /car-combat-arena/)
  base: process.env.VITE_BASE_PATH || "/",
  root: ".",
  publicDir: "public",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    // Inline small assets
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Keep asset names simple
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
