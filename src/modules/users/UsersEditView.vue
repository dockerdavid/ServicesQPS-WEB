<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import { UsersServices } from './users.services';
import type { NewUser, UserRoles, User, Role } from '../../interfaces/users/users.interface';
import type { InputConfig } from '../../interfaces/input-config.interface';

const route = useRoute();
const toast = useToast();
const userId = route.params.id as string;

const breadcrumbRoutes = [
    { label: 'Users', to: { name: 'users-default' } },
    { label: 'Edit', to: { name: 'users-edit' } },
];

const inputs: InputConfig[] = [
    { label: 'Name', inputId: 'name', inputType: 'input' },
    { label: 'Email', inputId: 'email', inputType: 'input' },
    { label: 'Role', inputId: 'roleId', inputType: 'select', options: [] },
    { label: 'Phone number', inputId: 'phoneNumber', inputType: 'numeric', inputNumericMode: 'decimal' },
];

const keyValueMap = {
    roleId: 'role.id', 
};

const loadData = async (id: string) => {
    const [userRolesResult, userResult] = await Promise.all([
        UsersServices.getUsersRoles(),
        UsersServices.getUserById(id),
    ]);
    const { id: _, ...userWithoutId } = userResult;
    return {
        ...userWithoutId,
        roleIdOptions: userRolesResult.map((role: UserRoles) => ({
            label: role.name,
            value: role.id,
        })),
    };
};

const updateEntity = async (id: string, data: NewUser) => {

    data.phoneNumber = `+${data.phoneNumber.toString()}`;
    await UsersServices.updateUser(id, data);

};
</script>

<template>
    <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit User" :inputs="inputs" :load-data="loadData"
        :update-entity="updateEntity" :initial-data="{
            email: '',
            name: '',
            phoneNumber: '',
            roleId: '',
        }" :key-value-map="keyValueMap" />
</template>