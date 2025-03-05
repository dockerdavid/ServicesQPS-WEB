import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Configura el proxy para redirigir solicitudes que comiencen con /api
      '/api': {
        target: 'https://api.servicesqps.com',  // URL de tu backend
        changeOrigin: true,  // Cambia el origen de la solicitud al backend
        rewrite: (path) => path.replace(/^\/api/, ''),  // Elimina el prefijo /api
      },
    },
  },
});