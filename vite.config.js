import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: forward /api to dev-api.js (run `npm run dev:api`)
    proxy: { '/api': 'http://localhost:3001' },
  },
})
