import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/opendatacatalog-fe/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:8443',
        changeOrigin: true,
        secure: false, // Ignora errori certificato SSL
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
