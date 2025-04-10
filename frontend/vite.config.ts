import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      }
    }
  }
})
