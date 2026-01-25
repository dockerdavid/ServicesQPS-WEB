import 'primeicons/primeicons.css';
import { createApp, markRaw } from 'vue';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import PrimeVue from 'primevue/config';
import { MyCustomPreset } from './assets/primevue_presets';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import { Icon } from '@iconify/vue';
const pinia = createPinia();
pinia.use(({ store }) => {
    store.router = markRaw(router);
});
pinia.use(createPersistedState());
const app = createApp(App);
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
})
    .use(ToastService);
app.directive('tooltip', Tooltip);
app.mount('#app');
