import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // göreli base: WebView içinde dosya/asset yükleyiciden açılabilsin (doküman §11.2, §12)
  base: './',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
  build: {
    // three.js tek başına ~600 kB; uyarı eşiğini ona göre yükselt
    chunkSizeWarningLimit: 700,
  },
})
