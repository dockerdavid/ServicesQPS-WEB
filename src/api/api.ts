import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/auth.store';

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
    return response;
}, (error) => {
    return Promise.reject(error)
})

