import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      vue(),
      !isProduction && vueDevTools(),
      tailwindcss(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    build: {
      target: 'es2019',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            primevue: ['primevue'],
            fullcalendar: [
              '@fullcalendar/core',
              '@fullcalendar/daygrid',
              '@fullcalendar/interaction',
              '@fullcalendar/timegrid',
              '@fullcalendar/vue3',
            ],
            utilities: ['axios', 'moment', 'zod', 'sweetalert2'],
          },
        },
      },
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'primevue',
        '@fullcalendar/core',
        '@fullcalendar/daygrid',
        '@fullcalendar/interaction',
        '@fullcalendar/timegrid',
        '@fullcalendar/vue3',
      ],
    },
  };
});
