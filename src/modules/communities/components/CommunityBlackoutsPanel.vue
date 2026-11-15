<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Checkbox, Column, DataTable, DatePicker, Dialog, InputText, MultiSelect, Select, useToast } from 'primevue';

import type { BlackoutPeriod, CommunityBlackout, NewCommunityBlackout } from '../../../interfaces/communities/community-blackouts.interface';
import type { Community } from '../../../interfaces/communities/communities.interface';
import { BLACKOUT_PERIOD_LABELS, CommunityBlackoutsServices, describeBlackoutWindow } from '../community-blackouts.services';
import { CommunitiesServices } from '../communities.services';
import { showToast } from '../../../utils/show-toast';

/**
 * Dias/horarios en los que la comunidad no recibe servicios (festividades).
 * El API rechaza crear o mover servicios a esas fechas y el generador de
 * recurrentes se las salta.
 */
const props = defineProps<{ communityId: string }>();

const toast = useToast();

const periodOptions = (Object.keys(BLACKOUT_PERIOD_LABELS) as BlackoutPeriod[])
  .map((value) => ({ value, label: BLACKOUT_PERIOD_LABELS[value] }));

const blackouts = ref<CommunityBlackout[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const showPast = ref(false);

const dateRange = ref<(Date | null)[] | Date | null>(null);
const period = ref<BlackoutPeriod>('full_day');
const startTime = ref('08:00');
const endTime = ref('17:00');
const reason = ref('');
const applyToAll = ref(false);
const otherCommunityIds = ref<string[]>([]);
const otherCommunities = ref<Community[]>([]);

const toDelete = ref<CommunityBlackout | null>(null);
const isDeleting = ref(false);

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: string) => {
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
};

const formatRange = (b: CommunityBlackout) => (b.startDate === b.endDate
  ? formatDisplayDate(b.startDate)
  : `${formatDisplayDate(b.startDate)} - ${formatDisplayDate(b.endDate)}`);

const today = formatDateParam(new Date());

const visibleBlackouts = computed(() => (showPast.value
  ? blackouts.value
  : blackouts.value.filter((b) => b.endDate >= today)));

const hiddenPastCount = computed(() => blackouts.value.length - visibleBlackouts.value.length);

const selectedDates = computed<{ start: string; end: string } | null>(() => {
  const value = dateRange.value;
  if (!value) return null;
  if (value instanceof Date) return { start: formatDateParam(value), end: formatDateParam(value) };
  const [start, end] = value;
  if (!start) return null;
  return { start: formatDateParam(start), end: formatDateParam(end ?? start) };
});

const loadBlackouts = async () => {
  if (!props.communityId) return;
  isLoading.value = true;
  try {
    blackouts.value = await CommunityBlackoutsServices.getBlackouts({ communityId: props.communityId });
  } catch (error) {
    blackouts.value = [];
    showToast(toast, { severity: 'error', summary: 'No se pudieron cargar los dias fuera de servicio.' });
  } finally {
    isLoading.value = false;
  }
};

const loadOtherCommunities = async () => {
  const result = await CommunitiesServices.getCommunities(1, 150);
  otherCommunities.value = result.data
    .filter((c) => String(c.id) !== String(props.communityId))
    .sort((a, b) => a.communityName.localeCompare(b.communityName));
};

const resetForm = () => {
  dateRange.value = null;
  period.value = 'full_day';
  reason.value = '';
  applyToAll.value = false;
  otherCommunityIds.value = [];
};

const addBlackout = async () => {
  const dates = selectedDates.value;
  if (!dates) {
    showToast(toast, { severity: 'warn', summary: 'Seleccione una fecha o un rango de fechas.' });
    return;
  }

  const payload: NewCommunityBlackout = {
    startDate: dates.start,
    endDate: dates.end,
    period: period.value,
    reason: reason.value.trim() || undefined,
  };

  if (period.value === 'custom') {
    if (!startTime.value || !endTime.value) {
      showToast(toast, { severity: 'warn', summary: 'Indique hora de inicio y fin.' });
      return;
    }
    // input type=time no permite 24:00: "00:00" como fin significa medianoche (fin del dia).
    const end = endTime.value === '00:00' ? '24:00' : endTime.value;
    if (end <= startTime.value) {
      showToast(toast, { severity: 'warn', summary: 'La hora de fin debe ser posterior a la de inicio.' });
      return;
    }
    payload.startTime = startTime.value;
    payload.endTime = end;
  }

  if (applyToAll.value) {
    payload.allCommunities = true;
  } else {
    payload.communityIds = [props.communityId, ...otherCommunityIds.value];
  }

  isSaving.value = true;
  try {
    const result = await CommunityBlackoutsServices.createBlackout(payload);
    const count = result.blackouts.length;
    showToast(toast, {
      severity: 'success',
      summary: 'Dia fuera de servicio guardado',
      detail: count > 1 ? `Se aplico a ${count} comunidades.` : undefined,
    });
    const conflicts = result.conflictingServices?.length ?? 0;
    if (conflicts) {
      showToast(toast, {
        severity: 'warn',
        summary: 'Hay servicios ya programados',
        detail: `${conflicts} servicio(s) ya creados caen en este horario. No se borraron: reviselos.`,
        life: 8000,
      });
    }
    resetForm();
    await loadBlackouts();
  } catch (error: any) {
    showToast(toast, { severity: 'error', summary: 'No se guardo', detail: error?.message });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async () => {
  if (!toDelete.value) return;
  isDeleting.value = true;
  try {
    await CommunityBlackoutsServices.deleteBlackout(toDelete.value.id);
    blackouts.value = blackouts.value.filter((b) => b.id !== toDelete.value?.id);
    toDelete.value = null;
    showToast(toast, { severity: 'success', summary: 'Bloqueo eliminado' });
  } catch (error: any) {
    showToast(toast, { severity: 'error', summary: 'No se elimino', detail: error?.message });
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  loadBlackouts();
  loadOtherCommunities();
});
</script>

<template>
  <fieldset class="community-blackouts-panel">
    <div class="blackouts-header">
      <div>
        <label class="blackouts-title">Días fuera de servicio</label>
        <p class="blackouts-subtitle">
          Festividades u horarios en que la comunidad no trabaja. No se podrán crear ni mover servicios a esas
          fechas y los recurrentes se saltan ese día. Un servicio sin hora (00:00) solo se bloquea si el día queda
          cubierto completo.
        </p>
      </div>
      <span class="blackouts-count">{{ visibleBlackouts.length }} programados</span>
    </div>

    <div class="blackouts-controls">
      <div class="blackouts-field">
        <label for="blackoutDates">Fecha o rango</label>
        <DatePicker
          v-model="dateRange"
          inputId="blackoutDates"
          selectionMode="range"
          :manualInput="false"
          dateFormat="mm/dd/yy"
          placeholder="Desde - Hasta"
          showIcon
          class="w-full"
        />
      </div>
      <div class="blackouts-field">
        <label for="blackoutPeriod">Horario</label>
        <Select
          v-model="period"
          inputId="blackoutPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>
      <div v-if="period === 'custom'" class="blackouts-field blackouts-times">
        <div>
          <label for="blackoutStart">Desde</label>
          <InputText id="blackoutStart" v-model="startTime" type="time" class="w-full" />
        </div>
        <div>
          <label for="blackoutEnd">Hasta</label>
          <InputText id="blackoutEnd" v-model="endTime" type="time" class="w-full" />
        </div>
      </div>
      <div class="blackouts-field">
        <label for="blackoutReason">Motivo (opcional)</label>
        <InputText id="blackoutReason" v-model="reason" maxlength="120" placeholder="Ej. Thanksgiving" class="w-full" />
      </div>
    </div>

    <div class="blackouts-controls blackouts-apply">
      <div class="blackouts-field">
        <label for="blackoutOthers">Aplicar también a</label>
        <MultiSelect
          v-model="otherCommunityIds"
          inputId="blackoutOthers"
          :options="otherCommunities"
          optionLabel="communityName"
          optionValue="id"
          :filter="true"
          :disabled="applyToAll"
          placeholder="Solo esta comunidad"
          display="chip"
          class="w-full"
        />
      </div>
      <div class="blackouts-all">
        <Checkbox v-model="applyToAll" inputId="blackoutAll" binary />
        <label for="blackoutAll">Todas las comunidades activas</label>
      </div>
      <Button type="button" label="Agregar" icon="pi pi-plus" :loading="isSaving" @click="addBlackout" />
    </div>

    <DataTable :value="visibleBlackouts" :loading="isLoading" dataKey="id" paginator :rows="10" stripedRows>
      <template #empty>
        <div class="blackouts-empty">No hay días fuera de servicio programados.</div>
      </template>
      <Column header="Fechas">
        <template #body="{ data }">{{ formatRange(data) }}</template>
      </Column>
      <Column header="Horario">
        <template #body="{ data }">{{ describeBlackoutWindow(data) }}</template>
      </Column>
      <Column header="Motivo">
        <template #body="{ data }">{{ data.reason || '-' }}</template>
      </Column>
      <Column header="" style="width: 4rem">
        <template #body="{ data }">
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            variant="text"
            rounded
            aria-label="Eliminar"
            @click="toDelete = data"
          />
        </template>
      </Column>
    </DataTable>

    <div v-if="hiddenPastCount || showPast" class="blackouts-past">
      <Button
        type="button"
        variant="text"
        size="small"
        :label="showPast ? 'Ocultar anteriores' : `Ver anteriores (${hiddenPastCount})`"
        @click="showPast = !showPast"
      />
    </div>

    <Dialog
      :visible="!!toDelete"
      modal
      header="Eliminar día fuera de servicio"
      :style="{ width: 'min(92vw, 28rem)' }"
      @update:visible="(v: boolean) => { if (!v) toDelete = null; }"
    >
      <p v-if="toDelete" class="dialog-copy">
        ¿Eliminar el bloqueo del {{ formatRange(toDelete) }} ({{ describeBlackoutWindow(toDelete) }})?
        Solo se elimina para esta comunidad.
      </p>
      <template #footer>
        <Button type="button" label="Cancelar" severity="secondary" variant="text" @click="toDelete = null" />
        <Button type="button" label="Eliminar" icon="pi pi-trash" severity="danger" :loading="isDeleting" @click="confirmDelete" />
      </template>
    </Dialog>
  </fieldset>
</template>

<style scoped>
.community-blackouts-panel {
  grid-column: 1 / -1;
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
  padding: 1rem;
}

.blackouts-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.blackouts-title {
  display: block;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.blackouts-subtitle {
  color: var(--p-surface-500);
  margin: 0;
}

.blackouts-count {
  background: var(--p-surface-100);
  border-radius: 999px;
  color: var(--p-surface-700);
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  white-space: nowrap;
}

.blackouts-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.blackouts-apply {
  grid-template-columns: minmax(12rem, 2fr) auto auto;
}

.blackouts-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.blackouts-times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.blackouts-times > div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.blackouts-all {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.6rem;
}

.blackouts-empty {
  color: var(--p-surface-500);
  padding: 1.5rem 0;
  text-align: center;
}

.blackouts-past {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.dialog-copy {
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 900px) {
  .blackouts-header {
    flex-direction: column;
  }

  .blackouts-apply {
    grid-template-columns: 1fr;
  }
}
</style>
