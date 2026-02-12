<script setup lang="ts">
import { ref } from "vue";
import { InputSwitch, useToast } from "primevue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { UsersServices } from "./users.services";
import { showToast } from "../../utils/show-toast";
import type { User } from "../../interfaces/users/users.interface";

const toast = useToast();
const pendingUpdates = ref<Record<string, ReturnType<typeof setTimeout>>>({});
const DEBOUNCE_MS = 500;

const fetchUsers = async (page: number, rows: number) => {
    return await UsersServices.getUsers(page, rows);
};

const deleteUser = async (id: string) => {
    return await UsersServices.deleteUser(id);
};

const searchUser = async (searchWord: string, page: number, rows: number) => {
    return await UsersServices.searchUser(searchWord, page, rows);
};

const saveIsActive = async (userId: string, isActive: boolean) => {
    try {
        await UsersServices.updateUserIsActive(userId, isActive);
        showToast(toast, { severity: "success", summary: "Usuario actualizado" });
    } catch {
        showToast(toast, { severity: "error", summary: "Error al actualizar" });
    }
};

const handleIsActiveChange = (row: User, newValue: boolean) => {
    row.isActive = newValue;

    const userId = row.id;
    if (pendingUpdates.value[userId]) {
        clearTimeout(pendingUpdates.value[userId]);
    }

    pendingUpdates.value[userId] = setTimeout(() => {
        saveIsActive(userId, newValue);
        delete pendingUpdates.value[userId];
    }, DEBOUNCE_MS);
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
            { field: 'phoneNumber', name: 'Phone number' },
            { field: 'isActive', name: 'Active', slotName: 'isActive' },
        ]"
        :fetch-data="fetchUsers"
        :delete-data="deleteUser"
        :search-data="searchUser"
    >
        <template #isActive="{ row }">
            <InputSwitch
                :model-value="row.isActive === true || row.isActive === 1"
                @update:model-value="(v: boolean) => handleIsActiveChange(row, v)"
            />
        </template>
    </GenericDataView>
</template>
