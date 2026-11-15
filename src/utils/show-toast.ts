import type { ToastMessageOptions } from 'primevue/toast';

import { isWithinPendingApprovalWindow } from './pending-approval';

export const showToast = (toast: any, options: ToastMessageOptions) => {
  // Si la última escritura quedó en aprobación (Admin Papel), el "guardado
  // correctamente" del formulario sería falso: ya se mostró el aviso de
  // aprobación desde el interceptor de axios.
  if (options.severity === 'success' && isWithinPendingApprovalWindow()) return;
  toast.add({ life: 3000, ...options });
};
