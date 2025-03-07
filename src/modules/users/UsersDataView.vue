<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { UsersServices } from "./users.services";

const fetchUsers = async (page: number, rows: number) => {
    return await UsersServices.getUsers(page, rows);
};

const deleteUser = async (id: string) => {
    return await UsersServices.deleteUser(id);
};

const updateUser = async (data: any) => {

};

const searchUser = async (searchWord: any) => {
    return await UsersServices.searchUser(searchWord)
};

</script>

<template>
    <GenericDataView
        view-title="Users"
        create-new-route="/users/create"
        :headers="[
            { field: 'name', name: 'Name' },
            { field: 'email', name: 'Email' },
            { field: 'role.name', name: 'Role' },
            { field: 'phoneNumber', name: 'Phone number' }
        ]"
        :editable-columns="['name', 'email']"
        :fetch-data="fetchUsers"
        :delete-data="deleteUser"
        :update-data="updateUser"
        :search-data="searchUser"
    />
</template>