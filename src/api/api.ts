import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/auth.store';

const apiUrl = import.meta.env.VITE_API_URL;

export const apiServicesQps = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json', 
      },
});

apiServicesQps.interceptors.request.use(async function (config: InternalAxiosRequestConfig) {
    const { token } = useAuthStore();
    
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


