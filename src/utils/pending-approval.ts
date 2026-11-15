/**
 * Respuesta 202 del API cuando un usuario Admin Papel (rol 9) intenta crear,
 * editar o borrar algo: el cambio NO se aplicó, quedó como solicitud que un
 * super admin debe aprobar (por SMS o en "Solicitudes de aprobación").
 */
export interface PendingApprovalResponse {
  pendingApproval: true;
  id: string;
  code: string;
  summary?: string;
  message: string;
}

export const isPendingApproval = (data: unknown): data is PendingApprovalResponse =>
  Boolean(data && typeof data === 'object' && (data as any).pendingApproval === true);

/** Ventana en la que los toasts de "éxito" de los formularios se omiten: el
 *  formulario cree que guardó, pero en realidad quedó en aprobación. */
const SUPPRESS_SUCCESS_MS = 4000;
let lastPendingApprovalAt = 0;

export const markPendingApproval = () => {
  lastPendingApprovalAt = Date.now();
};

export const isWithinPendingApprovalWindow = () => Date.now() - lastPendingApprovalAt < SUPPRESS_SUCCESS_MS;
