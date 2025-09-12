import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // URLs por branch:
        // dev_main: https://django-backend-e7od-4cjk.onrender.com
        // master: https://django-backend-e7od.onrender.com
        target: 'https://django-backend-e7od.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/media': {
        target: 'https://django-backend-e7od.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: [
      'frontend-s7jt-4cjk.onrender.com',  // dev_main
      'frontend-s7jt.onrender.com'        // master
    ]
  }
});
