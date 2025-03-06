// @/utils/show-toast.ts
import type { ToastMessageOptions } from 'primevue/toast';

export const showToast = (toast: any, options: ToastMessageOptions) => {
  toast.add({ life: 3000, ...options });
};