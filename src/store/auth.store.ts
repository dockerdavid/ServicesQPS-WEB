import { defineStore } from 'pinia';

interface AuthState {
  token: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
  }),

  getters: {
    getToken: (state): string => state.token,
  },

  actions: {
    setToken(token: string): void {
      this.token = token;
    },

    removeToken(): void {
      this.token = '';
    },
  },


  persist: true

});