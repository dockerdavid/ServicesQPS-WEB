import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/store/auth.store';


export const apiServicesQps = axios.create({
    baseURL: '/api',
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


