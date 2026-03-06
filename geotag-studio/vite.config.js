import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// GitHub Pages SPA fallback
const ghPagesSPA = () => ({
  name: 'gh-pages-spa',
  closeBundle() {
    const distDir = resolve(__dirname, 'dist')
    try {
      copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))
      writeFileSync(resolve(distDir, '.nojekyll'), '')
      console.log('✅ Created 404.html and .nojekyll for GitHub Pages')
    } catch { /* ignore during dev */ }
  }
})

export default defineConfig({
  plugins: [
    react(),
    ghPagesSPA(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'GeoTag Studio',
        short_name: 'GeoTag',
        description: 'GPS Metadata Editor — 100% Private',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/GeoTag-Studio/',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
          map: ['leaflet'],
        },
      },
    },
  },
})