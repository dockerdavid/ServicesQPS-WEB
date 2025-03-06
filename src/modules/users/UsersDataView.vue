<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { User, Users } from "@/interfaces/users/users.interface";
import { UsersServices } from "./users.services";
import { showToast } from "@/utils/show-toast";


const toast = useToast();

const usersList = ref<Users>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'name', name: 'Name' },
    { field: 'email', name: 'Email' },
    { field: 'role.name', name: 'Role' },
    { field: 'phoneNumber', name: 'Phone number' },
]);

const editableColumns = ref(['companyName']);

const onDelete = async (item: User) => {
    const originalData = [...usersList.value.data];
    usersList.value.data = usersList.value.data.filter((user) => user.id !== item.id);
    try {
        await UsersServices.deleteUser(item.id)
        showToast(toast, {
            summary: 'User deleted',
            detail: `User: ${item.name} - ${item.email}`,
            severity: "info"
        })
    } catch (error) {
        usersList.value.data = originalData;
        showToast(toast, {
            summary: "User wasn't deleted",
            detail: `User: ${item.name} - ${item.email}`,
            severity: "error"
        })
    }
};
const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    usersList.value = await UsersServices.getUsers();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Users</template>
        <template #create-new>
            <router-link to="/users/create">New user</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="usersList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>