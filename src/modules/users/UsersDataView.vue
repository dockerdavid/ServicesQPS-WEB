<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { UsersServices } from "./users.services";

const fetchUsers = async (page: number, rows: number) => {
    return await UsersServices.getUsers(page, rows);
};

const deleteUser = async (id: string) => {
    return await UsersServices.deleteUser(id);
};


const searchUser = async (searchWord: any, page: number, rows: number) => {
    return await UsersServices.searchUser(searchWord, page, rows)
};

</script>

<template>
    <GenericDataView view-title="Users" create-new-route="/users/create" :headers="[
        { field: 'name', name: 'Name' },
        { field: 'email', name: 'Email' },
        { field: 'role.name', name: 'Role' },
        { field: 'phoneNumber', name: 'Phone number' }
    ]" :fetch-data="fetchUsers" :delete-data="deleteUser"
         :search-data="searchUser" />
</template>