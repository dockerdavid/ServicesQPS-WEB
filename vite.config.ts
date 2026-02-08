import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';


// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const isProduction = mode === 'production';
  const plugins = [
    vue(),
    tailwindcss(),
  ];

  if (!isProduction) {
    try {
      const { default: vueDevTools } = await import('vite-plugin-vue-devtools');
      plugins.splice(1, 0, vueDevTools());
    } catch (error) {
      // Devtools is optional in dev; avoid crashing if it can't initialize in Node.
      console.warn('vite-plugin-vue-devtools disabled:', error);
    }
  }

  return {
    plugins,
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
