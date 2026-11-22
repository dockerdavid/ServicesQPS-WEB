<script setup lang="ts">
import { reactive, watch } from 'vue';
import { MultiSelect, SelectButton } from 'primevue';
import { NEWS_AUDIENCE_OPTIONS, type NewsAudienceUser } from '../../../interfaces/news/news.interface';
import { UsersServices } from '../../users/users.services';

/**
 * Audiencia de la noticia:
 * - Sin roles = todos los usuarios de la app.
 * - Por cada rol elegido: "Todo el rol" o "Usuarios específicos" (solo esos lo ven).
 */
const audienceRoles = defineModel<string[]>({ default: () => [] });
const audienceUsers = defineModel<NewsAudienceUser[]>('users', { default: () => [] });

type Mode = 'all' | 'specific';
const modeOptions = [
    { label: 'Todo el rol', value: 'all' },
    { label: 'Usuarios específicos', value: 'specific' },
];

const mode = reactive<Record<string, Mode>>({});
const usersByRole = reactive<Record<string, { label: string; value: string }[]>>({});
const loadingRole = reactive<Record<string, boolean>>({});

const roleLabel = (roleId: string) =>
    NEWS_AUDIENCE_OPTIONS.find((o) => o.value === roleId)?.label ?? `Rol ${roleId}`;

const loadUsers = async (roleId: string) => {
    if (usersByRole[roleId] || loadingRole[roleId]) return;
    loadingRole[roleId] = true;
    try {
        const res = await UsersServices.getUsers(1, 150, false, true, roleId);
        usersByRole[roleId] = (res.data ?? [])
            .map((u: any) => ({ label: u.name, value: String(u.id) }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
    } finally {
        loadingRole[roleId] = false;
    }
};

// Roles que ya traen usuarios elegidos (al editar) arrancan en "específicos".
watch(audienceUsers, (users) => {
    for (const u of users ?? []) {
        if (!mode[u.roleId]) {
            mode[u.roleId] = 'specific';
            loadUsers(u.roleId);
        }
    }
}, { immediate: true });

// Al quitar un rol se borran sus usuarios elegidos.
watch(audienceRoles, (roles) => {
    const keep = new Set((roles ?? []).map(String));
    if ((audienceUsers.value ?? []).some((u) => !keep.has(u.roleId))) {
        audienceUsers.value = (audienceUsers.value ?? []).filter((u) => keep.has(u.roleId));
    }
    for (const r of keep) if (!mode[r]) mode[r] = 'all';
});

const setMode = (roleId: string, value: Mode) => {
    mode[roleId] = value;
    if (value === 'specific') loadUsers(roleId);
    else audienceUsers.value = (audienceUsers.value ?? []).filter((u) => u.roleId !== roleId);
};

const selectedIds = (roleId: string) =>
    (audienceUsers.value ?? []).filter((u) => u.roleId === roleId).map((u) => u.id);

const setSelected = (roleId: string, ids: string[]) => {
    const others = (audienceUsers.value ?? []).filter((u) => u.roleId !== roleId);
    audienceUsers.value = [...others, ...(ids ?? []).map((id) => ({ id: String(id), roleId }))];
};
</script>

<template>
    <fieldset class="flex flex-col gap-3">
        <label for="news-audience">Audience <small class="text-gray-500">(vacío = todos los usuarios de la app)</small></label>
        <MultiSelect v-model="audienceRoles" inputId="news-audience" :options="NEWS_AUDIENCE_OPTIONS"
            optionLabel="label" optionValue="value" placeholder="All app users" :maxSelectedLabels="3"
            display="chip" class="w-full" />

        <div v-for="roleId in audienceRoles" :key="roleId" class="audience-role">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <strong>{{ roleLabel(roleId) }}</strong>
                <SelectButton :model-value="mode[roleId] ?? 'all'" :options="modeOptions" optionLabel="label"
                    optionValue="value" :allow-empty="false" size="small"
                    @update:model-value="(v: Mode) => setMode(roleId, v)" />
            </div>
            <MultiSelect v-if="mode[roleId] === 'specific'" :model-value="selectedIds(roleId)"
                :options="usersByRole[roleId] ?? []" optionLabel="label" optionValue="value" filter
                display="chip" :loading="loadingRole[roleId]" class="w-full mt-2"
                :placeholder="`Elige los ${roleLabel(roleId).toLowerCase()} que la verán`"
                @update:model-value="(ids: string[]) => setSelected(roleId, ids)" />
            <small v-if="mode[roleId] === 'specific' && !selectedIds(roleId).length" class="text-orange-600">
                Mientras no elijas a nadie, la verá todo el rol.
            </small>
        </div>
    </fieldset>
</template>

<style scoped>
.audience-role {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
}
</style>
