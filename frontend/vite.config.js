import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // Required for Docker — allows connections from outside the container
    host: '0.0.0.0',
    port: 5173,
    // Hot reload works through Docker volume mounts
    watch: {
      usePolling: true,   // needed on WSL and Docker for file change detection
      interval: 100,
    },
  },
})
