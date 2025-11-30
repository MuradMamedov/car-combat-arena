import { defineConfig } from "vite";

export default defineConfig({
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
        // Keep asset names simple for portable build
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
