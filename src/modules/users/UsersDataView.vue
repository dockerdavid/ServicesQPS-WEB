<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { IconField, InputIcon, InputSwitch, InputText, Message, Select, Tag, useToast } from "primevue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import ActiveStatusSelect from "../shared/components/ActiveStatusSelect.vue";
import { useStatusFilter } from "../shared/composables/useStatusFilter";
import { UsersServices } from "./users.services";
import { showToast } from "../../utils/show-toast";
import type { User, UserRoles } from "../../interfaces/users/users.interface";
import { CleanerZonesServices, formatEnforceFrom, type CleanerZoneStatus } from "./cleaner-zones.services";

const toast = useToast();
const pendingUpdates = ref<Record<string, ReturnType<typeof setTimeout>>>({});
const DEBOUNCE_MS = 500;

/** Filtro por tipo de usuario; `null` = todos. El API filtra (GET /users y
 *  POST /users/search) para que paginacion y total sigan siendo correctos. */
const selectedRoleId = ref<string | null>(null);
const roles = ref<UserRoles[]>([]);

/** Estado: por defecto solo activos, para no mezclar a los que ya no trabajan. */
const { selectedStatus, statusParam } = useStatusFilter();
/** Zona de trabajo de cleaners: "Sin zona" ayuda a terminar la configuracion
 *  antes de que el filtro entre en vigor. Elegir "Sin zona" filtra a cleaners. */
const selectedZone = ref<'none' | 'assigned' | null>(null);
const zoneOptions = [
    { label: 'Cleaners sin zona', value: 'none' },
    { label: 'Cleaners con zona', value: 'assigned' },
];
const zoneStatus = ref<CleanerZoneStatus | null>(null);
const roleParam = () => selectedRoleId.value ?? (selectedZone.value ? '4' : undefined);

const reloadKey = computed(() => `${selectedRoleId.value ?? 'all'}|${selectedStatus.value}|${selectedZone.value ?? 'any'}`);

const fetchUsers = async (page: number, rows: number) => {
    return await UsersServices.getUsers(page, rows, false, false, roleParam(), statusParam(), selectedZone.value ?? undefined);
};

const searchUser = async (searchWord: string, page: number, rows: number) => {
    return await UsersServices.searchUser(searchWord, page, rows, roleParam(), statusParam(), selectedZone.value ?? undefined);
};

onMounted(async () => {
    const [allRoles, status] = await Promise.all([UsersServices.getUsersRoles(), CleanerZonesServices.getStatus()]);
    roles.value = allRoles;
    zoneStatus.value = status;
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
        :reload-key="reloadKey"
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
                <ActiveStatusSelect v-model="selectedStatus" />
                <Select
                    v-model="selectedZone"
                    :options="zoneOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    placeholder="Zona de trabajo"
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
        <template #header-button v-if="zoneStatus && !zoneStatus.enforced">
            <Message severity="warn" size="small">
                Desde el {{ formatEnforceFrom(zoneStatus.enforceFrom) }} solo aparecerán las cleaners con zona asignada.
            </Message>
        </template>
        <template #isActive="{ row }">
            <div class="flex items-center gap-2">
                <InputSwitch
                    :model-value="row.isActive === true || row.isActive === 1"
                    @update:model-value="(v: boolean) => handleIsActiveChange(row, v)"
                />
                <Tag
                    v-if="String(row.role?.id ?? row.roleId) === '4' && !(row.hasWorkZone === true || row.hasWorkZone === 1)"
                    severity="warn"
                    value="Sin zona"
                    v-tooltip.top="'Sin zona de trabajo: edita la cleaner para asignarla'"
                />
            </div>
        </template>
    </GenericDataView>
</template>
