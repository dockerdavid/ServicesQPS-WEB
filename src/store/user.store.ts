import { defineStore } from 'pinia';
import type { User } from '../../src/interfaces/users/users.interface';


interface UserState {
    user: User;
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        user: {
            createdAt: new Date(),
            email: '',
            id: '',
            name: '',
            phoneNumber: '',
            role: {
                id: '',
                name: ''
            },
            roleId: ''
        }
    }),

    getters: {
        userData: (state): User => state.user
    },

    actions: {
        setUserData(userData: User): void {
            this.user = userData;
        }
    },

    persist: true

})

