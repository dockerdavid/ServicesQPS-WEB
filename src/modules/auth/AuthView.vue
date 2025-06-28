<template>
    <div class="card flex justify-center items-center h-[100vh]">
        <form @submit.prevent="onFormSubmit" class="flex flex-col gap-4 w-full sm:w-80 ">

            <img class="w-50 self-center" src="../../../public/images/logoqps.png" alt="">

            <div class="flex flex-col gap-1">
                <InputText type="email" placeholder="Email" v-model="form.username" />
                <Message v-if="errors.username" severity="error" size="small" variant="simple">{{ errors.username }}
                </Message>
            </div>
            <div class="flex flex-col gap-1">
                <Password type="password" placeholder="Password" v-model="form.password" :feedback="false" toggleMask />
                <Message v-if="errors.password" severity="error" size="small" variant="simple">{{ errors.password }}
                </Message>
            </div>

            <LoadingButton type="submit" label="Sign in" />
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { InputText, Message, Password } from 'primevue';
import { z } from 'zod';

import LoadingButton from '../shared/components/LoadingButton.vue';

import { apiServicesQps } from '../../api/api';

import type { AuthResponse } from '../../interfaces/auth/auth.interface';

import { useAuthStore, useGlobalStateStore } from '../../store/auth.store';
import { useUserStore } from '../../store/user.store';

import { UsersServices } from '../users/users.services';

import router from '../../router';
import roleRoutes from '../../../src/router/role-routes';

interface Form {
    username: string;
    password: string;
}

interface Errors {
    username: string;
    password: string;
}

const toast = useToast();

const store = useAuthStore();
const userstore = useUserStore();
const { setIsLoading } = useGlobalStateStore();

const schema = z.object({
    username: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

const form = reactive<Form>({
    username: '',
    password: '',
});

const errors = reactive<Errors>({
    username: '',
    password: '',
});


const validateForm = (): boolean => {
    try {
        schema.parse(form);
        return true;
    } catch (error) {
        if (error instanceof z.ZodError) {

            errors.username = '';
            errors.password = '';


            error.errors.forEach((err) => {
                if (err.path[0] === 'email') {
                    errors.username = err.message;
                } else if (err.path[0] === 'password') {
                    errors.password = err.message;
                }
            });
        }
        return false;
    }
};

const onFormSubmit = async (): Promise<void> => {

    errors.username = '';
    errors.password = '';

    if (validateForm()) {
        setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post<AuthResponse>('/auth', form);
            store.setToken(data.token)
            getUserData(data.id)

        } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.message, life: 3000 });
        } finally {
            setIsLoading(false)
        }
    }
};

const getUserData = async (userId: string) => {
    try {
        const data = await UsersServices.getUserById(userId)
        console.log('User data received:', data)
        userstore.setUserData(data)
        
        // Wait a bit to ensure the store is updated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const userRole = data.role.name.toLowerCase() as keyof typeof roleRoutes;
        console.log('User role:', userRole, 'Available routes:', roleRoutes[userRole])
        
        if (roleRoutes[userRole] && roleRoutes[userRole].length > 0) {
            const firstRoute = roleRoutes[userRole][0];
            console.log('Redirecting to:', firstRoute)
            router.push({ name: firstRoute })
        } else {
            console.error('No routes found for role:', userRole)
            toast.add({ severity: 'error', summary: 'Error', detail: 'No routes available for your role', life: 3000 });
        }
    } catch (error) {
        console.error('Error getting user data:', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error loading user data', life: 3000 });
    }
}

</script>