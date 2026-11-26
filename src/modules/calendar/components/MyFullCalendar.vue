<template>
  <div>
    <!-- Filtro global con diseño consistente -->
    <div class="flex flex-wrap items-end mb-4 gap-2">
      <MyInputGroup
        v-model="filterType"
        label="Filtro"
        inputId="filterType"
        inputType="select"
        :options="filterOptions"
        :required="false"
        :is-form-submitted="false"
        class="w-56"
      />
      <MyInputGroup
        v-model="filterText"
        label="Buscar"
        inputId="filterText"
        inputType="input"
        :required="false"
        :is-form-submitted="false"
        class="w-56"
        :placeholder="filterPlaceholder"
      />
      <LoadingButton
        label="Buscar"
        icon="pi pi-search"
        @click="applyFilter"
        class="p-button-primary"
      />
      <LoadingButton
        v-if="filterText"
        label="Limpiar"
        icon="pi pi-times"
        @click="clearFilter"
        class="p-button-secondary"
      />
      <fieldset class="w-64">
        <label for="dateRange">Rango de fechas</label>
        <DatePicker
          v-model="dateRange"
          inputId="dateRange"
          selectionMode="range"
          :manualInput="false"
          dateFormat="mm/dd/yy"
          placeholder="Desde - Hasta"
          showIcon
          class="w-full"
        />
      </fieldset>
      <LoadingButton
        v-if="activeRange"
        label="Quitar rango"
        icon="pi pi-times"
        @click="clearDateRange"
        class="p-button-secondary"
      />
      <Button
        v-if="canSuggest && unassignedCount > 0"
        class="suggest-trigger ml-auto"
        icon="pi pi-sparkles"
        :label="suggestionsActive ? 'Revisar sugerencias' : 'Sugerir asignaciones'"
        :badge="String(suggestionsActive ? applicable.length : unassignedCount)"
        badge-severity="contrast"
        @click="openSuggestions"
      />
    </div>

    <!-- Sugerencias activas: se ven como chips en los servicios sin cleaner -->
    <div v-if="canSuggest && suggestionsActive && suggestResult" class="calendar-banner calendar-banner--suggest" role="status">
      <i class="pi pi-sparkles calendar-banner__icon" />
      <span class="calendar-banner__text">
        <b>{{ applicable.length }}</b> sugerencia(s) marcadas en el calendario
        <span class="calendar-banner__score">
          · Balance {{ suggestResult.currentScore ?? '–' }}
          <i class="pi pi-arrow-right" />
          <b>{{ suggestResult.projectedScore ?? '–' }}</b>
        </span>
      </span>
      <span class="calendar-banner__actions">
        <Button label="Revisar y aplicar" size="small" icon="pi pi-list-check" @click="showSuggestDialog = true" />
        <Button label="Descartar" size="small" severity="secondary" text @click="discardSuggestions" />
      </span>
    </div>

    <div class="calendar-layout" :class="{ 'has-panel': showWorkloadPanel }">
      <CleanerWorkloadPanel
        v-if="showWorkloadPanel"
        class="calendar-layout__panel"
        v-model:selected-id="selectedCleanerId"
        v-model:include-qa="includeQa"
        :workloads="workloads"
        :balance="balance"
        :unassigned-count="unassignedCount"
        :range-days="rangeDays"
        :range-label="rangeLabel"
        :can-suggest="canSuggest"
        :suggestions-active="suggestionsActive"
        :projected-score="suggestResult?.projectedScore ?? null"
        :suggested-by-cleaner="suggestedByCleaner"
        @hover="hoveredCleanerId = $event"
        @suggest="openSuggestions"
      />
      <div ref="calendarColumn" class="calendar-layout__main" :class="{ 'is-hovering': !!hoveredCleanerId }">
        <div v-if="selectedCleanerId" class="calendar-banner calendar-banner--focus" role="status">
          <i class="pi pi-filter calendar-banner__icon" />
          <span class="calendar-banner__text">
            <template v-if="selectedCleanerId === UNASSIGNED_FILTER">
              Mostrando solo servicios <b>sin cleaner</b> ({{ unassignedCount }})
            </template>
            <template v-else>
              Mostrando servicios de <b>{{ selectedCleanerName }}</b> ({{ selectedCleanerTotal }})
              <template v-if="selectedCleanerSuggested"> + {{ selectedCleanerSuggested }} sugerido(s)</template>
            </template>
          </span>
          <Button label="Quitar filtro" size="small" severity="secondary" text icon="pi pi-times" @click="selectedCleanerId = null" />
        </div>
        <FullCalendar :options="calendarOptions" ref="fullCalendar" />
      </div>
    </div>

    <AssignmentSuggestionsDialog
      v-if="canSuggest"
      v-model:visible="showSuggestDialog"
      v-model:include-past="includePast"
      :result="suggestResult"
      :is-applying="isApplying"
      :progress="applyProgress"
      :range-label="rangeLabel"
      @pin="pinCleaner"
      @skip="setSkipped"
      @reset="resetOverrides"
      @discard="discardSuggestions"
      @apply="handleApplySuggestions"
    />
    
    <!-- Modal para mostrar información del servicio -->
    <Dialog 
      v-model:visible="showServiceModal" 
      modal 
      header="Información del Servicio" 
      :style="{ width: '80vw', maxWidth: '98vw' }"
      :closable="true"
      @hide="closeOnlyServiceModal"
    >
      <div v-if="selectedServiceInfo" class="service-info">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Información General</h3>
            <p><strong>ID:</strong> {{ selectedServiceInfo.id }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(selectedServiceInfo.date) }}</p>
            <p><strong>Horario:</strong> {{ selectedServiceInfo.schedule }}</p>
            <p><strong>Unidad:</strong> {{ selectedServiceInfo.unitNumber }}</p>
            <p><strong>Tamaño de Unidad:</strong> {{ selectedServiceInfo.unitySize }}</p>
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Personal</h3>
            <p><strong>Cleaner:</strong> {{ selectedServiceInfo.user?.name || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ selectedServiceInfo.user?.email || 'N/A' }}</p>
            <p><strong>Teléfono:</strong> {{ selectedServiceInfo.user?.phoneNumber || 'N/A' }}</p>
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Comunidad</h3>
            <p><strong>Nombre:</strong> {{ selectedServiceInfo.community?.communityName || 'N/A' }}</p>
            <p><strong>ID Comunidad:</strong> {{ selectedServiceInfo.communityId }}</p>
            <p><strong>Wax:</strong> {{ selectedServiceInfo.community?.useWax ? 'YES' : 'NO' }}</p>
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Servicio</h3>
            <p><strong>Tipo:</strong> {{ selectedServiceInfo.type?.cleaningType || 'N/A' }}</p>
            <p><strong>Descripción:</strong> {{ selectedServiceInfo.type?.description || 'N/A' }}</p>
            <p><strong>Precio:</strong> ${{ userStore.userData?.roleId === '7' ? 'XXXX' : (selectedServiceInfo.type?.price || 'N/A') }}</p>
            <p><strong>Comisión:</strong> {{ userStore.userData?.roleId === '7' ? 'XXXX' : (selectedServiceInfo.type?.commission || 'N/A') }}</p>
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Estado</h3>
            <p><strong>Estado:</strong> {{ selectedServiceInfo.status?.statusName || 'N/A' }}</p>
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Comentarios</h3>
            <p><strong>Comentario:</strong> {{ selectedServiceInfo.comment || 'Sin comentarios' }}</p>
            <p><strong>Comentario del Usuario:</strong> {{ selectedServiceInfo.userComment || 'Sin comentarios' }}</p>
          </div>
        </div>
        
        <div class="info-group mt-4">
          <h3 class="font-bold text-lg mb-2">Fechas</h3>
          <p><strong>Creado:</strong> {{ formatDate(selectedServiceInfo.createdAt) }}</p>
          <p><strong>Actualizado:</strong> {{ formatDate(selectedServiceInfo.updatedAt) }}</p>
        </div>
        
        <!-- Review por fotos (sin checklist): fotos de lo que quedó mal =
             refresh; sin fotos = aprobado. Incluye el historial de refresh. -->
        <QaPhotoReview
          :service-id="selectedServiceInfo.id"
          :capture-qa-location="userStore.userData?.roleId === '7'"
          @submitting="isSavingReview = $event"
          @submitted="onReviewSubmitted"
        />
      </div>
      
      <template #footer>
        <Button label="Cerrar" @click="closeOnlyServiceModal" :disabled="isSavingReview" class="p-button-secondary" />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'vue-router';
import type { CalendarInterface } from '../../../interfaces/calendar/calendar.interface';
import { CalendarServices } from '../calendar.services';
import type { EventInput } from '@fullcalendar/core/index.js';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import MyInputGroup from '../../shared/components/MyInputGroup.vue';
import LoadingButton from '../../shared/components/LoadingButton.vue';
import { useUserStore } from '../../../store/user.store';
import { canAccessRoute, isAdminLikeRole } from '../../../router/role-routes';
import { Dialog, Button, DatePicker, useToast } from 'primevue';
import QaPhotoReview from '../../kds/components/QaPhotoReview.vue';
import { showToast } from '../../../../src/utils/show-toast';
import { CleanersServices } from '../../services/services.services';
import { KdsServices, KDS_DAYS, type KdsDay } from '../../kds/kds.services';
import { captureLocation } from '../../../composables/useGeolocation';
import { blackoutEventContent, blackoutEventSource, isBlackoutEvent } from '../blackout-events';
import CleanerWorkloadPanel from './CleanerWorkloadPanel.vue';
import AssignmentSuggestionsDialog from './AssignmentSuggestionsDialog.vue';
import { useLoadBalancer, UNASSIGNED_FILTER } from '../composables/useLoadBalancer';
import { isUnassignedService } from '../utils/load-balancer';

const router = useRouter();
const userStore = useUserStore();
const toast = useToast();

const filterType = ref('');
const filterText = ref('');
const allEvents = ref<CalendarInterface[]>([]);
const calendarEvents = ref<EventInput[]>([]);
const isInitialLoad = ref(true);

// Rango de fechas: el calendario sigue en vista mes, pero solo muestra servicios dentro del rango
const dateRange = ref<(Date | null)[] | null>(null);
const activeRange = computed<{ start: string; end: string } | null>(() => {
  const [start, end] = dateRange.value ?? [];
  if (!start || !end) return null;
  return { start: toLocalYYYYMMDD(start), end: toLocalYYYYMMDD(end) };
});

// Estado para el modal
const showServiceModal = ref(false);
const selectedServiceInfo = ref<CalendarInterface | null>(null);

const isSavingReview = ref(false);

const isCalendarAdmin = () => {
  const roleId = userStore.userData?.roleId ?? '';
  const roleName = userStore.userData?.role?.name?.toLowerCase() ?? '';
  return isAdminLikeRole(roleId, roleName);
};

const isReadOnlyCalendarRole = () => {
  const roleId = userStore.userData?.roleId ?? '';
  return roleId === '4' || roleId === '7';
};

// --- Panel de carga de cleaners + sugerencias de asignacion -----------------
// Logica pura en ../utils/load-balancer.ts; estado reactivo en useLoadBalancer.
const {
  includeQa,
  loadCleaners,
  workloads,
  balance,
  unassignedCount,
  suggestionsActive,
  includePast,
  result: suggestResult,
  suggestionByServiceId,
  applicable,
  startSuggestions,
  clearSuggestions,
  resetOverrides,
  pinCleaner,
  setSkipped,
  applySuggestions,
  isApplying,
  progress: applyProgress,
} = useLoadBalancer(allEvents);

/** Cleaners y QA ven su propio calendario: el panel de carga es para la oficina. */
const showWorkloadPanel = computed(() => !isReadOnlyCalendarRole());
/** Sugerir y aplicar asignaciones: solo admin (roleId 1). */
const canSuggest = computed(() => isCalendarAdmin());

const selectedCleanerId = ref<string | null>(null);
const hoveredCleanerId = ref<string | null>(null);
const showSuggestDialog = ref(false);
const calendarColumn = ref<HTMLElement | null>(null);

/** Rango realmente cargado (mes visible, o la parte del rango que cae en el). */
const loadedRange = ref<{ start: string; end: string } | null>(null);

const rangeDays = computed(() => {
  const range = loadedRange.value;
  if (!range) return [];
  const days: string[] = [];
  const [sy, sm, sd] = range.start.split('-').map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  for (let i = 0; i < 62; i++) {
    const day = toLocalYYYYMMDD(cursor);
    if (day > range.end) break;
    days.push(day);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
});

const rangeLabel = computed(() => {
  const range = loadedRange.value;
  if (!range) return '';
  const [y, m] = range.start.split('-').map(Number);
  if (activeRange.value) return `${formatDate(range.start)} – ${formatDate(range.end)}`;
  const label = new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
});

const suggestedByCleaner = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};
  suggestionByServiceId.value.forEach((s) => {
    if (s.cleanerId) counts[s.cleanerId] = (counts[s.cleanerId] ?? 0) + 1;
  });
  return counts;
});

const selectedWorkload = computed(() => workloads.value.find((w) => w.cleanerId === selectedCleanerId.value) ?? null);
const selectedCleanerName = computed(() =>
  selectedWorkload.value?.name
  ?? allEvents.value.find((ev) => String(ev.userId) === selectedCleanerId.value)?.user?.name
  ?? 'cleaner',
);
const selectedCleanerTotal = computed(() =>
  selectedWorkload.value?.total
  ?? allEvents.value.filter((ev) => String(ev.userId) === selectedCleanerId.value).length,
);
const selectedCleanerSuggested = computed(() =>
  selectedCleanerId.value ? suggestedByCleaner.value[selectedCleanerId.value] ?? 0 : 0,
);

const openSuggestions = () => {
  if (!canSuggest.value) return;
  if (!suggestionsActive.value) startSuggestions();
  showSuggestDialog.value = true;
};

const discardSuggestions = () => {
  clearSuggestions();
  showSuggestDialog.value = false;
};

const handleApplySuggestions = async () => {
  if (!canSuggest.value) return;
  const { ok, failed } = await applySuggestions();
  if (ok) {
    showToast(toast, { severity: 'success', summary: 'Asignaciones aplicadas', detail: `${ok} servicio(s) asignado(s)` });
  }
  if (failed.length) {
    showToast(toast, {
      severity: 'error',
      summary: 'Algunas asignaciones fallaron',
      detail: `${failed.length} servicio(s) no se pudieron asignar. Quedan en la lista para reintentar.`,
      life: 6000,
    });
  }
  const currentDate = getCurrentViewDate();
  await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  if (!failed.length) {
    clearSuggestions();
    showSuggestDialog.value = false;
  }
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Resalta (sin filtrar) los servicios del cleaner bajo el cursor en el panel. */
const syncHoverHighlight = () => {
  const root = calendarColumn.value;
  if (!root) return;
  const id = hoveredCleanerId.value;
  root.querySelectorAll<HTMLElement>('.fc-event').forEach((el) => {
    const match = !!id && (el.dataset.userId === id || el.dataset.suggestedId === id);
    el.classList.toggle('qps-ev--hover', match);
  });
};
watch(hoveredCleanerId, syncHoverHighlight);


const filterOptions = [
  { label: 'Nombre Cleaner', value: 'cleaner' },
  { label: 'Unidad de Apartamento', value: 'unit' },
  { label: 'Nombre Comunidad', value: 'community' }
];

const filterPlaceholder = computed(() => {
  switch (filterType.value) {
    case 'cleaner': return 'Escribe el nombre del cleaner';
    case 'unit': return 'Escribe la unidad de apartamento';
    case 'community': return 'Escribe el nombre de la comunidad';
    default: return 'Buscar...';
  }
});

const applyTextFilter = (events: CalendarInterface[]): CalendarInterface[] => {
  if (!filterType.value || !filterText.value.trim()) return events;
  const text = filterText.value.trim().toLowerCase();
  if (filterType.value === 'cleaner') {
    return events.filter(ev => (ev.user?.name || '').toLowerCase().includes(text));
  } else if (filterType.value === 'unit') {
    return events.filter(ev => (ev.unitNumber || '').toLowerCase().includes(text));
  } else if (filterType.value === 'community') {
    return events.filter(ev => (ev.community?.communityName || '').toLowerCase().includes(text));
  }
  return [];
};

/** Filtro del panel de carga: un cleaner (sus servicios + los sugeridos para el) o "sin asignar". */
const applyCleanerFilter = (events: CalendarInterface[]): CalendarInterface[] => {
  const selected = selectedCleanerId.value;
  if (!selected) return events;
  if (selected === UNASSIGNED_FILTER) return events.filter(ev => isUnassignedService(ev));
  return events.filter(ev =>
    String(ev.userId ?? '') === selected
    || suggestionByServiceId.value.get(String(ev.id))?.cleanerId === selected,
  );
};

const applyFilter = () => {
  calendarEvents.value = applyCleanerFilter(applyTextFilter(allEvents.value)).map(eventToCalendarEvent);
  calendarOptions.value.events = calendarEvents.value;
};

const clearFilter = () => {
  filterText.value = '';
  applyFilter();
};

const clearDateRange = () => {
  dateRange.value = null;
};

const reloadCalendarEvents = async (year?: number, month?: number) => {
  let events: CalendarInterface[];
  const range = activeRange.value;
  if (range) {
    // Solo se pide la parte del rango que cae en el mes visible
    const viewDate = getCurrentViewDate();
    const y = year ?? viewDate.getFullYear();
    const m = month ?? (viewDate.getMonth() + 1);
    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
    const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    const start = range.start > monthStart ? range.start : monthStart;
    const end = range.end < monthEnd ? range.end : monthEnd;
    events = start <= end ? await CalendarServices.getCalendarDataByRange(start, end) : [];
    loadedRange.value = start <= end ? { start, end } : null;
  } else {
    events = await CalendarServices.getCalendarData(year, month);
    const viewDate = getCurrentViewDate();
    const y = year ?? viewDate.getFullYear();
    const m = month ?? (viewDate.getMonth() + 1);
    loadedRange.value = {
      start: `${y}-${String(m).padStart(2, '0')}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`,
    };
  }
  if (userStore.userData?.roleId === '7') {
    events = events.filter(ev => ['3', '5', '6'].includes(ev.statusId));
  }
  allEvents.value = events;
  // Reaplica el filtro de texto (si hay) y el del panel de carga
  applyFilter();
};

const getCurrentViewDate = () => {
  const api = fullCalendar.value?.getApi();
  return api?.getDate() ?? new Date();
};

const QA_DAY_SHORT_LABELS: Record<KdsDay, string> = {
  monday: 'LUN',
  tuesday: 'MAR',
  wednesday: 'MIÉ',
  thursday: 'JUE',
  friday: 'VIE',
};

const handleAssignQaDay = async (serviceInfo: CalendarInterface, day: KdsDay) => {
  try {
    await KdsServices.assignServiceToDay(serviceInfo.id, day);
    showToast(toast, {
      severity: 'success',
      detail: `Unidad marcada para QA el ${QA_DAY_SHORT_LABELS[day]}`,
    });
    const currentDate = getCurrentViewDate();
    await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'No se pudo marcar la unidad para QA' });
  }
};

const handleUnassignQa = async (serviceInfo: CalendarInterface) => {
  try {
    await KdsServices.unassignService(serviceInfo.id);
    showToast(toast, { severity: 'success', detail: 'Marca de QA removida' });
    const currentDate = getCurrentViewDate();
    await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'No se pudo quitar la marca de QA' });
  }
};

const handleDeleteFromCalendar = async (serviceId: string) => {
  try {
    await CleanersServices.deleteService(serviceId);
    showToast(toast, { severity: 'success', detail: 'Service was deleted' });
    const currentDate = getCurrentViewDate();
    await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Service wasn't deleted" });
  }
};

const openServiceModal = async (serviceInfo: CalendarInterface) => {
  if (userStore.userData?.roleId === '7' && !serviceInfo.qaStartedAt) {
    // Fire and forget — don't block opening the modal
    captureLocation()
      .then(loc => CalendarServices.postQAStart(serviceInfo.id, loc))
      .catch(() => {});
  }
  await _loadReviewModal(serviceInfo);
};

const _loadReviewModal = async (serviceInfo: CalendarInterface) => {
  selectedServiceInfo.value = serviceInfo;
  showServiceModal.value = true;
};


const closeOnlyServiceModal = () => {
  if (isSavingReview.value) return;
  showServiceModal.value = false;
  selectedServiceInfo.value = null;
};

const onReviewSubmitted = async () => {
  showServiceModal.value = false;
  selectedServiceInfo.value = null;
  const currentDate = getCurrentViewDate();
  await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
};

function toLocalYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const isOutsideActiveRange = (date: Date): boolean => {
  const range = activeRange.value;
  if (!range) return false;
  const day = toLocalYYYYMMDD(date);
  return day < range.start || day > range.end;
};

function toYYYYMMDD(date: any): string {
  if (typeof date === 'string' && date.length >= 10) return date.substring(0, 10);
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const QA_FLAG_COLOR = '#f97316';
const RETURNED_ASSIGNMENT_COLOR = '#ef4444';

const isQaPendingFlag = (event: CalendarInterface): boolean => {
  const statusName = event.status?.statusName?.toLowerCase().trim() ?? '';
  return !!event.qaFlagged && statusName !== 'finished';
};

const isReturnedAssignment = (event: CalendarInterface): boolean => {
  return event.statusId === '1' && !event.userId && Boolean(event.assignmentExpiredAt);
};

const displayedStatus = (event: CalendarInterface): string => {
  return isReturnedAssignment(event) ? 'Returned' : (event.status?.statusName || 'N/A');
};

const eventToCalendarEvent = (event: CalendarInterface): EventInput => {
  const suggestion = suggestionByServiceId.value.get(String(event.id)) ?? null;
  const selected = selectedCleanerId.value;
  const classNames: string[] = [];
  if (suggestion) classNames.push('qps-ev--suggested');
  if (selected && selected !== UNASSIGNED_FILTER && String(event.userId ?? '') === selected) classNames.push('qps-ev--focus');
  if (selected && suggestion?.cleanerId === selected) classNames.push('qps-ev--proposed');
  return {
  id: event.id,
  start: toYYYYMMDD(event.date),
  allDay: true,
  classNames,
  color: isReturnedAssignment(event)
    ? RETURNED_ASSIGNMENT_COLOR
    : (isQaPendingFlag(event) ? QA_FLAG_COLOR : getEventColor(event.status?.statusName)),
  extendedProps: {
    userId: event.userId ? String(event.userId) : '',
    suggestedId: suggestion?.cleanerId ?? '',
    suggestedName: suggestion?.cleanerName ?? '',
    suggestedReason: suggestion?.reason ?? '',
    userName: event.user?.name || 'N/A',
    communityName: event.community?.communityName || 'N/A',
    useWax: !!event.community?.useWax,
    status: displayedStatus(event),
    type: event.type?.cleaningType || 'N/A',
    unitNumber: event.unitNumber || 'N/A',
    date: toYYYYMMDD(event.date),
    qaFlagged: !!event.qaFlagged,
    comment: event.comment || '',
    userComment: event.userComment || '',
    schedule: event.schedule || '',
  },
  };
};

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: calendarEvents.value,
  // Dias fuera de servicio de las comunidades, sombreados de fondo.
  eventSources: [blackoutEventSource],
  editable: false,
  selectable: false,
  timeZone: 'local',
  dayCellClassNames: (arg: any) => (isOutsideActiveRange(arg.date) ? ['fc-day-out-of-range'] : []),
  datesSet: async (dateInfo: any) => {
    // Se dispara cuando cambia el mes/año en el calendario (incluyendo la carga inicial)
    const currentDate = dateInfo.view.currentStart;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() retorna 0-11, necesitamos 1-12
    await reloadCalendarEvents(year, month);
    isInitialLoad.value = false;
  },
  eventClick: (info: any) => {
    if (isBlackoutEvent(info.event)) return;
    // Solo abre la edicion quien tiene permiso de editar servicios: el Cheo ve
    // el calendario pero no `services-edit`, y el guard lo sacaba a notFound.
    const canEdit = canAccessRoute('services-edit', userStore.userData?.role?.name, userStore.userData?.roleId);
    if (isReadOnlyCalendarRole() || !canEdit) {
      return;
    }
    router.push(`/services/edit/${info.event.id}`);
  },
  eventContent: (arg: any) => {
    const event = arg.event;
    if (isBlackoutEvent(event)) return blackoutEventContent(event);
    // Formato personalizado como la imagen
    return {
      html: `
        <div style="font-family: inherit; font-size: 13px;">
          <b>${event.extendedProps.userName}</b><br/>
          <b>Community:</b> ${event.extendedProps.communityName}<br/>
          <b>Unit number:</b> ${event.extendedProps.unitNumber}<br/>
          <b>Date:</b> ${formatDate(event.extendedProps.date)}<br/>
          <b>Type:</b> ${event.extendedProps.type}<br/>
          <b>Status:</b> ${event.extendedProps.status}
          ${event.extendedProps.suggestedName ? `
            <div class="qps-suggest-chip" title="${escapeHtml(event.extendedProps.suggestedReason)}">
              <i class="pi pi-sparkles"></i><span>${escapeHtml(event.extendedProps.suggestedName)}</span>
            </div>
          ` : ''}
        </div>
      `,
    };
  },
  eventDidMount: (info: any) => {
    const event = info.event;
    if (isBlackoutEvent(event)) {
      info.el.title = [event.title, ...(event.extendedProps.communities ?? [])].join('\n');
      return;
    }
    const serviceInfo = allEvents.value.find(ev => ev.id === event.id);
    info.el.dataset.userId = event.extendedProps.userId || '';
    info.el.dataset.suggestedId = event.extendedProps.suggestedId || '';
    if (hoveredCleanerId.value) {
      const id = hoveredCleanerId.value;
      info.el.classList.toggle('qps-ev--hover', info.el.dataset.userId === id || info.el.dataset.suggestedId === id);
    }
    
    // El detalle del servicio en calendario queda solo para admin.
    // QA lo maneja exclusivamente desde KDS QA.
    const canShowButton = isCalendarAdmin();
    const canDelete = isCalendarAdmin();
    
    const p = event.extendedProps;
    const statusColor = info.el.style.backgroundColor || event.backgroundColor || '#64748b';
    const scheduleLabel = p.schedule && !String(p.schedule).startsWith('00:00') ? ` · ${escapeHtml(String(p.schedule).slice(0, 5))}` : '';
    const row = (icon: string, label: string, value: string) => `
      <div class="qtt-row"><i class="pi ${icon}"></i><span class="qtt-label">${label}</span><span class="qtt-value">${value}</span></div>`;
    const btn = (id: string, label: string, kind: string) => `<button id="${id}" class="qtt-btn qtt-btn--${kind}">${label}</button>`;

    const tooltipContent = `
      <div class="qtt">
        <div class="qtt-head">
          <span class="qtt-dot" style="background:${statusColor}"></span>
          <div class="qtt-title">
            <strong>${escapeHtml(p.userName)}</strong>
            <span>${escapeHtml(p.status)}</span>
          </div>
          ${p.useWax ? '<span class="qtt-badge qtt-badge--wax">WAX</span>' : ''}
        </div>
        <div class="qtt-body">
          ${row('pi-building', 'Community', escapeHtml(p.communityName))}
          ${row('pi-home', 'Unit', escapeHtml(p.unitNumber))}
          ${row('pi-calendar', 'Date', escapeHtml(formatDate(p.date)) + scheduleLabel)}
          ${row('pi-tag', 'Type', escapeHtml(p.type))}
        </div>
        ${p.comment ? `
          <div class="qtt-note">
            <div class="qtt-note-label"><i class="pi pi-comment"></i> Comentario</div>
            <div class="qtt-note-text">${escapeHtml(p.comment)}</div>
          </div>` : ''}
        ${p.userComment ? `
          <div class="qtt-note qtt-note--cleaner">
            <div class="qtt-note-label"><i class="pi pi-user"></i> Nota de la cleaner</div>
            <div class="qtt-note-text">${escapeHtml(p.userComment)}</div>
          </div>` : ''}
        ${p.suggestedName ? `
          <div class="qtt-suggest">
            <b>Sugerido:</b> ${escapeHtml(p.suggestedName)}
            <span>${escapeHtml(p.suggestedReason)}</span>
          </div>` : ''}
        ${canShowButton && serviceInfo ? `
          <div class="qtt-actions">
            ${btn(`service-modal-btn-${event.id}`, 'Ver detalles', 'primary')}
            ${serviceInfo.qaFlagged
              ? btn(`service-qa-flag-btn-${event.id}`, `Quitar marca QA${serviceInfo.kdsDay ? ` (${QA_DAY_SHORT_LABELS[serviceInfo.kdsDay]})` : ''}`, 'muted')
              : `<span class="qtt-qa"><span>QA</span>${KDS_DAYS.map((day) => btn(`service-qa-day-btn-${event.id}-${day}`, QA_DAY_SHORT_LABELS[day], 'qa')).join('')}</span>`}
            ${canDelete ? btn(`service-delete-btn-${event.id}`, 'Eliminar', 'danger') : ''}
          </div>` : ''}
      </div>
    `;

    tippy(info.el, {
      content: tooltipContent,
      allowHTML: true,
      // Arriba por defecto; si no cabe (servicio cerca del borde de la ventana)
      // se voltea hacia abajo o a los lados y nunca se sale del viewport.
      placement: 'top',
      appendTo: () => document.body,
      maxWidth: 340,
      delay: [120, 60],
      offset: [0, 8],
      animation: 'shift-away-subtle',
      trigger: 'mouseenter',
      interactive: true,
      theme: 'custom-tooltip',
      popperOptions: {
        strategy: 'fixed',
        modifiers: [
          { name: 'flip', options: { fallbackPlacements: ['bottom', 'right', 'left'], padding: 12, boundary: 'viewport' } },
          { name: 'preventOverflow', options: { boundary: 'viewport', padding: 12, altAxis: true, tether: false } },
        ],
      },
      onShow: (instance) => {
        // Agregar evento click al botón después de que el tooltip se muestre
        if (canShowButton && serviceInfo) {
          setTimeout(() => {
            const button = document.getElementById(`service-modal-btn-${event.id}`);
            if (button) {
              button.addEventListener('click', (eventClick) => {
                eventClick.stopPropagation();
                openServiceModal(serviceInfo);
                instance.hide();
              });
            }
            const qaFlagButton = document.getElementById(`service-qa-flag-btn-${event.id}`);
            if (qaFlagButton) {
              qaFlagButton.addEventListener('click', async (eventClick) => {
                eventClick.stopPropagation();
                await handleUnassignQa(serviceInfo);
                instance.hide();
              });
            }
            KDS_DAYS.forEach((day) => {
              const dayButton = document.getElementById(`service-qa-day-btn-${event.id}-${day}`);
              if (dayButton) {
                dayButton.addEventListener('click', async (eventClick) => {
                  eventClick.stopPropagation();
                  await handleAssignQaDay(serviceInfo, day);
                  instance.hide();
                });
              }
            });
            if (canDelete) {
              const deleteButton = document.getElementById(`service-delete-btn-${event.id}`);
              if (deleteButton) {
                deleteButton.addEventListener('click', async (eventClick) => {
                  eventClick.stopPropagation();
                  await handleDeleteFromCalendar(event.id);
                  instance.hide();
                });
              }
            }
          }, 100);
        }
      }
    });
  },
});

function getEventColor(status: string): string {
  const statusFormatted = status ? status.toLowerCase().trim() : '';
  switch (statusFormatted) {
    case "created": return '#da1919';
    case "pending": return '#f7e83a';
    case "approved": return '#00e01f';
    case "rejected": return '#9500c1';
    case "completed": return '#000000';
    case "finished": return '#00a7b2';
    default: return '#00a7b2';
  }
}

function formatDate(date: string | Date): string {
  // Normalizar siempre a YYYY-MM-DD tomando los primeros 10 caracteres
  // Esto funciona con "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ssZ" y objetos Date
  const dateStr = typeof date === 'string'
    ? date.substring(0, 10)
    : `${(date as Date).getUTCFullYear()}-${String((date as Date).getUTCMonth() + 1).padStart(2, '0')}-${String((date as Date).getUTCDate()).padStart(2, '0')}`;
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

let calendarResizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  // datesSet se encargará de cargar los datos iniciales
  // No necesitamos cargar aquí para evitar doble carga
  if (calendarColumn.value) {
    // El panel lateral cambia el ancho de la columna: FullCalendar tiene que enterarse.
    calendarResizeObserver = new ResizeObserver(() => fullCalendar.value?.getApi()?.updateSize());
    calendarResizeObserver.observe(calendarColumn.value);
  }
  if (showWorkloadPanel.value) {
    await loadCleaners();
  }
});

onBeforeUnmount(() => {
  calendarResizeObserver?.disconnect();
});

const fullCalendar = ref<typeof FullCalendar | null>(null);

// Filtro del panel / sugerencias: re-pinta el calendario
watch([selectedCleanerId, suggestionByServiceId], () => applyFilter());

// Watcher para limpiar el filtro automáticamente si el input queda vacío
watch(filterText, (newVal) => {
  if (newVal === '') {
    applyFilter();
  }
});

// Al elegir o quitar un rango: ir al mes donde empieza, recargar y sombrear los días fuera del rango
watch(activeRange, async (range, previous) => {
  if (range?.start === previous?.start && range?.end === previous?.end) return;
  calendarOptions.value.dayCellClassNames = (arg: any) => (isOutsideActiveRange(arg.date) ? ['fc-day-out-of-range'] : []);
  const api = fullCalendar.value?.getApi();
  if (range && api) {
    const [y, m] = range.start.split('-').map(Number);
    const viewDate = api.getDate();
    if (viewDate.getFullYear() !== y || viewDate.getMonth() + 1 !== m) {
      // gotoDate dispara datesSet, que recarga los eventos
      api.gotoDate(range.start);
      return;
    }
  }
  const currentDate = getCurrentViewDate();
  await reloadCalendarEvents(currentDate.getFullYear(), currentDate.getMonth() + 1);
});

defineExpose({
  getApi: () => fullCalendar.value?.getApi(),
});
</script>

<style>
.fc {
  width: 100%;
  margin: 0 auto;
}

/* --- Panel de carga + sugerencias ---------------------------------------- */
.calendar-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.calendar-layout__main {
  flex: 1;
  min-width: 0;
}
@media (min-width: 1024px) {
  .calendar-layout.has-panel {
    flex-direction: row;
    align-items: flex-start;
  }
  .calendar-layout__panel {
    order: 2;
    flex: 0 0 300px;
    width: 300px;
  }
}
@media (min-width: 1536px) {
  .calendar-layout__panel {
    flex-basis: 330px;
    width: 330px;
  }
}

.calendar-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: #fff;
  font-size: 0.85rem;
  color: var(--ink-700);
}
.calendar-banner__icon {
  font-size: 0.85rem;
}
.calendar-banner__text {
  flex: 1;
  min-width: 12rem;
}
.calendar-banner__text b {
  color: var(--ink-900);
}
.calendar-banner__score {
  white-space: nowrap;
  color: var(--ink-500);
}
.calendar-banner__score .pi {
  font-size: 0.65rem;
  margin: 0 0.15rem;
}
.calendar-banner__actions {
  display: flex;
  gap: 0.35rem;
}
.calendar-banner--suggest {
  background: linear-gradient(90deg, #f5f3ff, #eef3ff);
  border-color: #ddd6fe;
}
.calendar-banner--suggest .calendar-banner__icon {
  color: #7c3aed;
}
.calendar-banner--focus {
  background: var(--accent-100);
  border-color: var(--accent-200);
}
.calendar-banner--focus .calendar-banner__icon {
  color: var(--accent-600);
}

/* Servicio sin cleaner con sugerencia */
.fc .fc-event.qps-ev--suggested {
  outline: 2px dashed #8b5cf6;
  outline-offset: -2px;
}
.fc .qps-suggest-chip {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  margin-top: 4px;
  padding: 1px 8px 1px 6px;
  border-radius: 999px;
  background: #ffffff;
  color: #5b21b6;
  border: 1px solid #c4b5fd;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fc .qps-suggest-chip .pi {
  font-size: 10px;
}
/* Sugerido al cleaner filtrado: se ve "propuesto", no asignado */
.fc .fc-event.qps-ev--proposed {
  background-image: repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0 6px, transparent 6px 12px);
}
/* Cleaner filtrado */
.fc .fc-event.qps-ev--focus {
  box-shadow: inset 4px 0 0 var(--accent-600);
}
/* Hover en el panel: atenua el resto */
.calendar-layout__main.is-hovering .fc-event {
  transition: opacity 0.15s ease;
}
.calendar-layout__main.is-hovering .fc-event:not(.qps-ev--hover) {
  opacity: 0.25;
}
.calendar-layout__main .fc-event.qps-ev--hover {
  box-shadow: 0 0 0 2px var(--accent-500);
  position: relative;
  z-index: 2;
}

.suggest-trigger.p-button {
  background: linear-gradient(135deg, #6d28d9, var(--accent-600));
  border-color: transparent;
}
.suggest-trigger.p-button:not(:disabled):hover {
  background: linear-gradient(135deg, #5b21b6, var(--accent-700));
  border-color: transparent;
}

.fc .fc-day-out-of-range {
  background-color: #f1f5f9;
  opacity: 0.55;
}

.tippy-box[data-theme="custom-tooltip"] {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06);
  color: #1f2937;
}
.tippy-box[data-theme="custom-tooltip"] .tippy-content { padding: 0; }
.tippy-box[data-theme="custom-tooltip"] .tippy-arrow { color: #ffffff; }
.tippy-box[data-animation="shift-away-subtle"][data-state="hidden"] { opacity: 0; transform: translateY(4px); }
.tippy-box[data-animation="shift-away-subtle"] { transition-property: transform, opacity; }

.qtt { font-family: inherit; font-size: 13px; width: 300px; max-width: calc(100vw - 32px); }
.qtt-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px 10px; border-bottom: 1px solid #f1f5f9; }
.qtt-dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06); }
.qtt-title { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.qtt-title strong { font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qtt-title span { font-size: 12px; color: #64748b; }
.qtt-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 3px 7px; border-radius: 999px; }
.qtt-badge--wax { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.qtt-body { padding: 8px 14px; display: flex; flex-direction: column; gap: 5px; }
.qtt-row { display: grid; grid-template-columns: 16px 78px 1fr; align-items: center; gap: 6px; }
.qtt-row i { font-size: 12px; color: #94a3b8; }
.qtt-label { color: #64748b; font-size: 12px; }
.qtt-value { color: #0f172a; font-weight: 500; overflow-wrap: anywhere; }
.qtt-note { margin: 4px 14px 8px; padding: 8px 10px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; }
.qtt-note--cleaner { border-left-color: #10b981; }
.qtt-note-label { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; display: flex; align-items: center; gap: 4px; }
.qtt-note-text { white-space: pre-wrap; overflow-wrap: anywhere; color: #1e293b; line-height: 1.4; max-height: 160px; overflow-y: auto; }
.qtt-suggest { margin: 4px 14px 8px; padding: 7px 9px; border-radius: 6px; background: #f5f3ff; color: #5b21b6; font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
.qtt-suggest span { color: #6b7280; }
.qtt-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px 14px 12px; border-top: 1px solid #f1f5f9; }
.qtt-qa { display: inline-flex; align-items: center; gap: 3px; }
.qtt-qa > span { font-size: 11px; font-weight: 700; color: #9a3412; margin-right: 2px; }
.qtt-btn { border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; transition: filter 0.15s, transform 0.05s; }
.qtt-btn:hover { filter: brightness(0.92); }
.qtt-btn:active { transform: translateY(1px); }
.qtt-btn--primary { background: #2563eb; color: #fff; }
.qtt-btn--muted { background: #e2e8f0; color: #334155; }
.qtt-btn--qa { background: #f97316; color: #fff; padding: 5px 7px; font-size: 11px; }
.qtt-btn--danger { background: #fee2e2; color: #b91c1c; }

.service-info {
  max-height: 70vh;
  overflow-y: auto;
}

.info-group {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-soft);
}

.info-group h3 {
  color: var(--ink-800);
  border-bottom: 2px solid var(--accent-500);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.info-group p {
  margin: 0.5rem 0;
  line-height: 1.4;
}

.info-group strong {
  color: var(--ink-700);
}

.review-section {
  border-left: 3px solid var(--accent-500);
  padding-left: 1rem;
}

.review-section h4 {
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--accent-600);
}

.review-section .flex {
  transition: background-color 0.2s ease;
}

.review-section .flex:hover {
  background-color: #f1f5f9 !important;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .service-info .grid-cols-2 {
    grid-template-columns: 1fr !important;
  }
  .service-info {
    max-height: 60vh;
    padding: 0.5rem;
  }
}
@media (max-width: 640px) {
  .service-info {
    max-height: 50vh;
    padding: 0.25rem;
  }
  .review-section {
    padding-left: 0.5rem;
    border-left-width: 2px;
  }
  .info-group {
    padding: 0.5rem;
  }
}
</style>
