import { defineStore } from 'pinia';

/**
 * Cambio de clave obligatorio (lo pide un admin). Lo activan el login, GET
 * /auth/me (ForcePasswordChangeDialog) y el interceptor de axios ante un 403
 * PASSWORD_CHANGE_REQUIRED. Sin persistir: se vuelve a consultar al abrir.
 */
let onResolved: (() => void) | null = null;

export const PASSWORD_CHANGE_REQUIRED_CODE = 'PASSWORD_CHANGE_REQUIRED';

export const isPasswordChangeRequiredError = (error: any): boolean =>
    error?.response?.status === 403 && error?.response?.data?.code === PASSWORD_CHANGE_REQUIRED_CODE;

export const usePasswordGateStore = defineStore('passwordGate', {
    state: () => ({
        required: false,
    }),

    actions: {
        /** `afterChange` corre al completar el cambio (ej. seguir con el login). */
        require(afterChange?: () => void): void {
            this.required = true;
            if (afterChange) onResolved = afterChange;
        },

        resolve(): void {
            this.required = false;
            const callback = onResolved;
            onResolved = null;
            callback?.();
        },

        reset(): void {
            this.required = false;
            onResolved = null;
        },

        hasPendingCallback(): boolean {
            return onResolved !== null;
        },
    },
});
