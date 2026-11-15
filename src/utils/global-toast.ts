import type { ToastMessageOptions } from 'primevue/toast';
import type { ToastServiceMethods } from 'primevue/toastservice';

/** Toast accesible fuera de componentes (p. ej. interceptores de axios).
 *  App.vue lo registra con useToast() al montar. */
let globalToast: ToastServiceMethods | null = null;

export const setGlobalToast = (toast: ToastServiceMethods) => {
  globalToast = toast;
};

export const addGlobalToast = (options: ToastMessageOptions) => {
  globalToast?.add(options);
};
