import { defineStore } from 'pinia';


interface AuthState {
  userToken: string;
}

interface GlobalState {
  isLoadingState: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    userToken: '',
  }),

  getters: {
    token: (state): string => state.userToken,
  },

  actions: {
    setToken(token: string): void {
      this.userToken = token;
    },

    removeToken(): void {
      this.userToken = '';
    },
  },


  persist: true

});


export const useGlobalStateStore = defineStore('state', {
  state: (): GlobalState => ({
    isLoadingState: false
  }),

  getters: {
    isLoading: (state): boolean => state.isLoadingState
  },

  actions: {
    setIsLoading(isLoading: boolean): void {
      this.isLoadingState = isLoading;
    }
  }

})

