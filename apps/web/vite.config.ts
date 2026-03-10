import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: 'electron/preload.ts',
      }
    }),
  ],
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.178:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://192.168.1.178:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.1.178:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
