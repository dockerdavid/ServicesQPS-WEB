<template>

    <CreateLayout>


        <template #view-title>Create user</template>


        <template #inputs>

            <MyInputGroup v-model="newUser.name" input-type="input" label="Name" input-id="name" />
            <MyInputGroup v-model="newUser.email" input-type="input" label="Email" input-id="email" />
            <MyInputGroup v-model="newUser.password" input-type="input" label="Password" input-id="password" />
            <MyInputGroup :options="userRolesOptions" v-model="newUser.roleId" input-type="select" label="Role" input-id="role" />
            <MyInputGroup v-model="newUser.phoneNumber" input-type="input" label="Phone number"
                input-id="phone-number" />

            <div />

            <div>
                <Button>Create</Button>
            </div>

        </template>

    </CreateLayout>

</template>

<script setup lang="ts">

import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { showToast } from '@/utils/show-toast';
import { Button, useToast } from 'primevue';
import { UsersServices } from './users.services';
import type { NewUser, UserRoles } from '@/interfaces/users/users.interface';
import { computed, onMounted, ref } from 'vue';


const toast = useToast();

const usersRoles = ref<UserRoles[]>([]);
const userRolesOptions = computed(()=>{
    return usersRoles.value?.map((rol)=>{
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
        await UsersServices.createUser(newUser.value);
        showToast(toast, { severity: 'success', detail: 'User was created' })
        newUser.value = {
            email: '',
            name: '',
            password: '',
            phoneNumber: '',
            roleId: ''
        }
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "User wasn't created" })
    }

}

onMounted(async () => {
    usersRoles.value = await UsersServices.getUsersRoles();
})



</script>
