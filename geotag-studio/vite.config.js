import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'

// Custom plugin to handle GitHub Pages SPA routing
const ghPagesSPA = () => ({
  name: 'gh-pages-spa',
  closeBundle() {
    const distDir = resolve(__dirname, 'dist')
    // Copy index.html to 404.html so GitHub Pages serves the SPA for all routes
    copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))
    // Create .nojekyll to prevent Jekyll processing
    writeFileSync(resolve(distDir, '.nojekyll'), '')
    console.log('✅ Created 404.html and .nojekyll for GitHub Pages')
  }
})

export default defineConfig({
  plugins: [react(), ghPagesSPA()],
  base: '/GeoTag-Studio/',
})