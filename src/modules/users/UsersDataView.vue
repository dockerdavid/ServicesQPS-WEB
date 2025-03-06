<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { User, Users } from "@/interfaces/users/users.interface";
import { UsersServices } from "./users.services";


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

const onDelete = (item: User) => {
    usersList.value.data = usersList.value.data.filter((company) => company.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'User deleted',
        detail: `User: ${item.name}`,
        severity: "info"
    })
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