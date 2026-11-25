import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/auth.store';
import { isPendingApproval, markPendingApproval } from '../utils/pending-approval';
import { addGlobalToast } from '../utils/global-toast';

const apiUrl = import.meta.env.VITE_API_URL;

export const apiServicesQps = axios.create({

    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json', 
      },
});

apiServicesQps.interceptors.request.use(async function (config: InternalAxiosRequestConfig) {
    const { token: storeToken } = useAuthStore();
    let token = storeToken;

    if (!token && typeof window !== 'undefined') {
        try {
            const raw = window.localStorage.getItem('auth');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.userToken) {
                    token = parsed.userToken;
                }
            }
        } catch (error) {
            // ignore localStorage errors
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

}, (error) => {
    console.log(error)
})


apiServicesQps.interceptors.response.use((response) => {
    // Admin Papel: el API respondió 202 sin aplicar el cambio. La respuesta se
    // deja pasar como éxito (los formularios vuelven al listado), pero se avisa
    // que quedó en aprobación y se silencian sus toasts de "guardado".
    if (response.status === 202 && isPendingApproval(response.data)) {
        markPendingApproval();
        addGlobalToast({
            severity: 'info',
            summary: `Enviado a aprobación (código ${response.data.code})`,
            detail: response.data.message || 'Un administrador debe aprobar este cambio.',
            life: 7000,
        });
    }
    return response;
}, (error) => {
    return Promise.reject(error)
})

