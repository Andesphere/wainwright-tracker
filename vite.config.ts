import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
      "@": path.resolve(dirname, "./src"),
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
        start_url: "/app",
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
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "map-style-and-vector-tiles" },
          },
          {
            urlPattern: /^https:\/\/tile\.opentopomap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "wainwright-lake-district-topo-v1",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 900,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
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
