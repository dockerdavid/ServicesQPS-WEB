<script setup lang="ts">

import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { showToast } from '@/utils/show-toast';
import { Button, useToast } from 'primevue';
import { UsersServices } from './users.services';
import type { NewUser, UserRoles } from '@/interfaces/users/users.interface';
import { computed, onMounted, ref } from 'vue';
import LoadingButton from '../shared/components/LoadingButton.vue';


const toast = useToast();

const breadcrumbRoutes = [
    { label: 'Users', to: { name: 'users-default' } },
    { label: 'Edit', to: { name: 'users-edit' } },
];

const usersRoles = ref<UserRoles[]>([]);
const userRolesOptions = computed(() => {
    return usersRoles.value?.map((rol) => {
        return {
            label: rol.name,
            value: rol.id
        }
    })
})

const newUser = ref<NewUser>({
    email: '',
    name: '',
    password: '',
    phoneNumber: '',
    roleId: ''
});

const createUser = async () => {

    try {
        newUser.value.phoneNumber = `+${newUser.value.phoneNumber.toString()}`
        await UsersServices.createUser(newUser.value);
        showToast(toast, { severity: 'success', detail: 'User was updated' })
        newUser.value = {
            email: '',
            name: '',
            password: '',
            phoneNumber: '',
            roleId: ''
        }
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "User wasn't updated" })
    }

}

onMounted(async () => {
    usersRoles.value = await UsersServices.getUsersRoles();
})



</script>


<template>

    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">


        <template #view-title>Edit user</template>


        <template #inputs>

            <MyInputGroup v-model="newUser.name" input-type="input" label="Name" input-id="name" />
            <MyInputGroup v-model="newUser.email" input-type="input" label="Email" input-id="email" />
            <MyInputGroup v-model="newUser.password" input-type="input" label="Password" input-id="password" />
            <MyInputGroup :options="userRolesOptions" v-model="newUser.roleId" input-type="select" label="Role"
                input-id="role" />
            <MyInputGroup v-model="newUser.phoneNumber" input-type="numeric" input-numeric-mode="decimal"
                label="Phone number" input-id="phone-number" />

            <div />

            <div>
                <LoadingButton @click="createUser" />
            </div>

        </template>

    </CreateLayout>

</template>
