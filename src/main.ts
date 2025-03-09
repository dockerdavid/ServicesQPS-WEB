import 'primeicons/primeicons.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2';

import PrimeVue from 'primevue/config';
import { MyCustomPreset } from './assets/primevue_presets';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';

import './assets/main.css';

import { Icon } from '@iconify/vue';

const app = createApp(App);
const pinia = createPinia();


const installPersistedStatePlugin = createPersistedStatePlugin()
pinia.use((context) => installPersistedStatePlugin(context))


app.component('Icon', Icon);

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