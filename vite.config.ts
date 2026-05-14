import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("maplibre-gl")) return "map";
          if (id.includes("react")) return "react";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Wainwright Tracker",
        short_name: "Wainwrights",
        description:
          "Track completed Wainwright fells on a rich Lake District map.",
        theme_color: "#1f2d23",
        background_color: "#fbf7ec",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/",
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/(tiles\.openfreemap\.org|tile\.opentopomap\.org)\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "map-tiles" },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: { cacheName: "font-assets" },
          },
        ],
      },
    }),
  ],
});
