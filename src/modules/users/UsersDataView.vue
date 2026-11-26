<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Button, Dialog, IconField, InputIcon, InputSwitch, InputText, Message, Select, Tag, useToast } from "primevue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import ActiveStatusSelect from "../shared/components/ActiveStatusSelect.vue";
import { useStatusFilter } from "../shared/composables/useStatusFilter";
import { UsersServices } from "./users.services";
import { showToast } from "../../utils/show-toast";
import type { User, UserRoles } from "../../interfaces/users/users.interface";
import { useUserStore } from "../../store/user.store";
import { isPendingApproval } from "../../utils/pending-approval";
import { getApiErrorMessage } from "../../utils/api-error-message";
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

/* ---------- Cambio de clave obligatorio ---------- */
const userStore = useUserStore();
/** Solo super admin (1) y Admin Papel (9, que pasa por aprobación). */
const canRequestPasswordChange = computed(() => ['1', '9'].includes(String(userStore.userData?.roleId ?? '')));
const dataViewRef = ref<InstanceType<typeof GenericDataView> | null>(null);
const rowBusy = ref<Record<string, boolean>>({});

const togglePasswordChange = async (row: User) => {
    if (rowBusy.value[row.id]) return;
    rowBusy.value[row.id] = true;
    const requesting = !row.mustChangePassword;
    try {
        const data = requesting
            ? await UsersServices.requirePasswordChange(row.id)
            : await UsersServices.cancelPasswordChange(row.id);
        if (isPendingApproval(data)) return; // Admin Papel: queda en aprobación, el interceptor ya avisó.
        row.mustChangePassword = requesting;
        showToast(toast, {
            severity: "success",
            summary: requesting ? "Cambio de clave pedido" : "Pedido de cambio de clave quitado",
            detail: requesting ? `${row.name} deberá crear una clave nueva al entrar.` : row.name,
        });
    } catch (error) {
        showToast(toast, { severity: "error", summary: "Error", detail: getApiErrorMessage(error) });
    } finally {
        rowBusy.value[row.id] = false;
    }
};

const bulkDialogVisible = ref(false);
const bulkRoleId = ref<string | null>(null);
const bulkCount = ref<number | null>(null);
const bulkCounting = ref(false);
const bulkSaving = ref(false);
const bulkRoleName = computed(() => roles.value.find((r) => String(r.id) === String(bulkRoleId.value))?.name ?? '');

const openBulkDialog = () => {
    bulkRoleId.value = null;
    bulkCount.value = null;
    bulkDialogVisible.value = true;
};

watch(bulkRoleId, async (roleId) => {
    bulkCount.value = null;
    if (!roleId) return;
    bulkCounting.value = true;
    try {
        const count = await UsersServices.countActiveByRole(roleId);
        if (bulkRoleId.value === roleId) bulkCount.value = count;
    } catch {
        bulkCount.value = null;
    } finally {
        bulkCounting.value = false;
    }
});

const confirmBulk = async () => {
    if (!bulkRoleId.value || bulkSaving.value) return;
    bulkSaving.value = true;
    try {
        const data = await UsersServices.requirePasswordChangeForRole(bulkRoleId.value);
        bulkDialogVisible.value = false;
        if (isPendingApproval(data)) return;
        showToast(toast, {
            severity: "success",
            summary: "Cambio de clave pedido",
            detail: `${data.affected ?? 0} usuario(s) activos de ${data.roleName ?? bulkRoleName.value} deberán crear una clave nueva.`,
            life: 6000,
        });
        dataViewRef.value?.reload();
    } catch (error) {
        showToast(toast, { severity: "error", summary: "Error", detail: getApiErrorMessage(error) });
    } finally {
        bulkSaving.value = false;
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
        ref="dataViewRef"
        view-title="Users"
        create-new-route="/users/create"
        :headers="[
            { field: 'name', name: 'Name' },
            { field: 'email', name: 'Email' },
            { field: 'role.name', name: 'Role' },
            { field: 'phoneNumber', name: 'Phone number' },
            { field: 'isActive', name: 'Active', slotName: 'isActive' },
            { field: 'mustChangePassword', name: 'Clave', slotName: 'passwordChange' },
        ]"
        :fetch-data="fetchUsers"
        :delete-data="UsersServices.deleteUser"
        :hide-delete="true"
        :search-data="searchUser"
        :reload-key="reloadKey"
    >
        <template #header-search="{ searchWord, clearSearch, setSearchWord }">
            <div class="flex flex-wrap items-center justify-end gap-3 w-full">
                <Button
                    v-if="canRequestPasswordChange"
                    label="Pedir cambio de clave a todo un rol"
                    icon="pi pi-key"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="openBulkDialog"
                />
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
        <template #passwordChange="{ row }">
            <div class="flex flex-wrap items-center gap-2">
                <Tag v-if="row.mustChangePassword" severity="warn" value="Cambio pendiente" />
                <Button
                    v-if="canRequestPasswordChange"
                    :label="row.mustChangePassword ? 'Quitar pedido' : 'Pedir cambio de clave'"
                    :icon="row.mustChangePassword ? 'pi pi-times' : 'pi pi-key'"
                    size="small"
                    text
                    :severity="row.mustChangePassword ? 'secondary' : 'warn'"
                    :loading="rowBusy[row.id]"
                    @click="togglePasswordChange(row)"
                />
            </div>
        </template>
    </GenericDataView>

    <Dialog
        v-model:visible="bulkDialogVisible"
        modal
        header="Pedir cambio de clave a todo un rol"
        class="w-[95vw] sm:w-[28rem]"
    >
        <div class="flex flex-col gap-4">
            <p class="m-0 text-sm text-gray-600">
                Todos los usuarios <b>activos</b> del rol deberán crear una clave nueva al abrir la app o la web.
                Las sesiones abiertas también quedan bloqueadas hasta que la cambien.
            </p>
            <Select
                v-model="bulkRoleId"
                :options="roles"
                optionLabel="name"
                optionValue="id"
                placeholder="Selecciona un rol"
                class="w-full"
            />
            <p v-if="bulkRoleId" class="m-0 text-sm">
                <span v-if="bulkCounting">Contando usuarios…</span>
                <span v-else-if="bulkCount !== null">
                    Se pedirá el cambio a <b>{{ bulkCount }}</b> usuario(s) activos de <b>{{ bulkRoleName }}</b>.
                </span>
            </p>
        </div>
        <template #footer>
            <Button label="Cancelar" severity="secondary" text @click="bulkDialogVisible = false" :disabled="bulkSaving" />
            <Button
                label="Confirmar"
                icon="pi pi-check"
                severity="warn"
                :disabled="!bulkRoleId || bulkCounting || bulkCount === 0"
                :loading="bulkSaving"
                @click="confirmBulk"
            />
        </template>
    </Dialog>
</template>
