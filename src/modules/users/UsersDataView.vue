<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputSwitch, InputText, Select, useToast } from "primevue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { UsersServices } from "./users.services";
import { showToast } from "../../utils/show-toast";
import type { User, UserRoles } from "../../interfaces/users/users.interface";

const toast = useToast();
const pendingUpdates = ref<Record<string, ReturnType<typeof setTimeout>>>({});
const DEBOUNCE_MS = 500;

/** Filtro por tipo de usuario; `null` = todos. El API filtra (GET /users y
 *  POST /users/search) para que paginacion y total sigan siendo correctos. */
const selectedRoleId = ref<string | null>(null);
const roles = ref<UserRoles[]>([]);

const fetchUsers = async (page: number, rows: number) => {
    return await UsersServices.getUsers(page, rows, false, false, selectedRoleId.value ?? undefined);
};

const searchUser = async (searchWord: string, page: number, rows: number) => {
    return await UsersServices.searchUser(searchWord, page, rows, selectedRoleId.value ?? undefined);
};

onMounted(async () => {
    roles.value = await UsersServices.getUsersRoles();
});

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
        :delete-data="UsersServices.deleteUser"
        :hide-delete="true"
        :search-data="searchUser"
        :reload-key="selectedRoleId"
    >
        <template #header-search="{ searchWord, clearSearch, setSearchWord }">
            <div class="flex flex-wrap items-center justify-end gap-3 w-full">
                <Select
                    v-model="selectedRoleId"
                    :options="roles"
                    optionLabel="name"
                    optionValue="id"
                    showClear
                    placeholder="All roles"
                    class="min-w-[12rem]"
                />
                <IconField>
                    <InputIcon class="pi pi-search" />
                    <InputText
                        :model-value="searchWord"
                        @update:model-value="(v?: string) => setSearchWord(v ?? '')"
                        placeholder="Search"
                    />
                    <InputIcon v-if="searchWord" class="pi pi-times cursor-pointer text-gray-500 hover:text-black"
                        @click="clearSearch" />
                </IconField>
            </div>
        </template>
        <template #isActive="{ row }">
            <InputSwitch
                :model-value="row.isActive === true || row.isActive === 1"
                @update:model-value="(v: boolean) => handleIsActiveChange(row, v)"
            />
        </template>
    </GenericDataView>
</template>
