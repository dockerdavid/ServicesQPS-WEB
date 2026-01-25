import { defineStore } from 'pinia';
export const useUserStore = defineStore('user', {
    state: () => ({
        user: null
    }),
    getters: {
        userData: (state) => state.user
    },
    actions: {
        setUserData(userData) {
            this.user = userData;
        },
        removeUserData() {
            this.user = null;
        }
    },
    persist: true
});
