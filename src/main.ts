import './assets/main.scss';
import 'primeicons/primeicons.css';


import { createApp } from 'vue';
import { createPinia } from 'pinia';

import PrimeVue from 'primevue/config';

import App from './App.vue';
import router from './router';

import { MyCustomPreset } from './assets/primevue_presets';

import { Icon } from "@iconify/vue";

const app = createApp(App)

app.component('Icon', Icon);
app.use(createPinia())
app.use(router)
.use(PrimeVue, {
    theme:{
        preset: MyCustomPreset,
        options: {
            darkModeSelector: false || 'none',
        }
    }
})

app.mount('#app')
