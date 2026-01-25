import { defineStore } from 'pinia';
export const useAuthStore = defineStore('auth', {
    state: () => ({
        userToken: '',
    }),
    getters: {
        token: (state) => state.userToken,
    },
    actions: {
        setToken(token) {
            this.userToken = token;
        },
        removeToken() {
            this.userToken = '';
        },
    },
    persist: true
});
export const useGlobalStateStore = defineStore('state', {
    state: () => ({
        isLoadingState: false
    }),
    getters: {
        isLoading: (state) => state.isLoadingState
    },
    actions: {
        setIsLoading(isLoading) {
            this.isLoadingState = isLoading;
        }
    }
});
