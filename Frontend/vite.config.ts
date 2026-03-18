import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://examguard-ai-production.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})