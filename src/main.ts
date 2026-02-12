import 'primeicons/primeicons.css';

import { createApp, markRaw } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

import PrimeVue from 'primevue/config';
import { MyCustomPreset } from './assets/primevue_presets';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';

import './assets/main.css';

import { Icon } from '@iconify/vue';

const pinia = createPinia();

pinia.use(({store})=>{
  store.router = markRaw(router);
});

pinia.use(createPersistedState());


const app = createApp(App);

app.component('Icon', Icon);

// Evitar pantalla en blanco: mostrar mensaje si algo falla al renderizar
app.config.errorHandler = (err, _instance, info) => {
  const el = document.getElementById('app');
  if (el && !el.querySelector('[data-error-fallback]')) {
    const div = document.createElement('div');
    div.setAttribute('data-error-fallback', 'true');
    div.innerHTML = '<p><strong>Error al cargar la aplicación.</strong></p><p>Prueba: F12 → pestaña Application → Storage → Clear site data, luego recarga.</p>';
    div.style.cssText = 'padding: 2rem; font-family: sans-serif; max-width: 32rem;';
    el.appendChild(div);
  }
};

app.use(pinia)
   .use(router)
   .use(PrimeVue, {
     theme: {
       preset: MyCustomPreset,
       options: {
         darkModeSelector: false || 'none',
       },
     },
   }
  )
  .use(ToastService);
  app.directive('tooltip', Tooltip)

app.mount('#app');