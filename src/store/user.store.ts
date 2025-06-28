import { defineStore } from 'pinia';
import type { User } from '../../src/interfaces/users/users.interface';


interface UserState {
    user: User | null;
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        user: null
    }),

    getters: {
        userData: (state): User | null => state.user
    },

    actions: {
        setUserData(userData: User): void {
            this.user = userData;
        },
        removeUserData () {
            this.user = null
        }
    },

    persist: true

})

