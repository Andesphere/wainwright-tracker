import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wainwright Tracker',
        short_name: 'Wainwrights',
        description: 'Track completed Wainwright fells on a rich Lake District map.',
        theme_color: '#203b22',
        background_color: '#0f140d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(tiles\.openfreemap\.org|tile\.opentopomap\.org)\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'map-tiles' },
          },
        ],
      },
    }),
  ],
})
