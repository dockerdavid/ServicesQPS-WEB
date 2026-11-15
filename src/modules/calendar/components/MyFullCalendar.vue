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
        
        <!-- Sección Review -->
        <div class="info-group mt-4">
          <h3 class="font-bold text-lg mb-4">Review</h3>
          <div v-for="reviewClass in reviewData" :key="reviewClass.reviewClassId" class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">{{ reviewClass.reviewClassName }}:</h4>
            <div class="hidden md:grid grid-cols-1 gap-2">
              <div v-for="item in reviewClass.reviewItems" :key="item.id" class="flex items-center justify-between p-2 bg-gray-50 rounded whitespace-nowrap">
                <span class="text-sm mr-4">{{ item.name }}</span>
                <InputSwitch v-model="item.checked" />
              </div>
            </div>
            <div class="md:hidden overflow-x-auto">
              <div class="flex gap-2 min-w-max">
                <div v-for="item in reviewClass.reviewItems" :key="item.id" class="flex items-center justify-between p-2 bg-gray-50 rounded whitespace-nowrap">
                  <span class="text-sm mr-4">{{ item.name }}</span>
                  <InputSwitch v-model="item.checked" />
                </div>
              </div>
            </div>
          </div>
          <!-- Comentario del Review -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Comentario:</h4>
            <fieldset>
              <Textarea 
                v-model="reviewComment" 
                placeholder="Escribe un comentario sobre el review..." 
                :rows="4" 
                :auto-resize="false" 
                class="w-full"
                style="max-height: 150px;"
              />
            </fieldset>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button label="Guardar" @click="closeServiceModal" :disabled="isSavingReview" class="p-button-secondary" />
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
import { Dialog, Button, InputSwitch, Textarea, DatePicker, useToast } from 'primevue';
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

// Estado para los datos de review
const reviewData = ref<any[]>([]);

// Estado para el comentario del review
const reviewComment = ref('');

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
  const data = await CalendarServices.getReviewItemsWithClasses();
  const serviceReviews = serviceInfo.reviews || [];
  if (Array.isArray(data)) {
    reviewData.value = data.map((cls: any) => ({
      ...cls,
      reviewItems: cls.reviewItems.map((item: any) => {
        const found = serviceReviews.find((r: any) => r.reviewItemId === item.id);
        return { ...item, checked: found ? found.value === 1 : false };
      })
    }));
  } else {
    reviewData.value = [];
  }
  showServiceModal.value = true;
};


const closeOnlyServiceModal = () => {
  showServiceModal.value = false;
  selectedServiceInfo.value = null;
  // Resetear el comentario
  reviewComment.value = '';
  // Resetear los checks
  reviewData.value = reviewData.value.map((cls: any) => ({
    ...cls,
    reviewItems: cls.reviewItems.map((item: any) => ({ ...item, checked: false }))
  }));
};

const closeServiceModal = async () => {
  isSavingReview.value = true;
  const serviceId = selectedServiceInfo.value?.id || '';
  const message = reviewComment.value;
  const reviewItemsPayload: { reviewItemId: string, value: boolean }[] = [];
  reviewData.value.forEach((cls: any) => {
    cls.reviewItems.forEach((item: any) => {
      reviewItemsPayload.push({ reviewItemId: item.id, value: !!item.checked });
    });
  });

  if (serviceId) {
    const isQA = userStore.userData?.roleId === '7';
    let finishLocation: any = {};
    if (isQA) {
      try {
        const loc = await captureLocation();
        finishLocation = loc;
      } catch {
        // location failed — submit without finish coords
      }
    }

    await CalendarServices.postServiceReview({
      serviceId,
      message,
      reviewItems: reviewItemsPayload,
      ...finishLocation,
    });
  }

  showServiceModal.value = false;
  selectedServiceInfo.value = null;
  reviewComment.value = '';
  reviewData.value = reviewData.value.map((cls: any) => ({
    ...cls,
    reviewItems: cls.reviewItems.map((item: any) => ({ ...item, checked: false }))
  }));
  isSavingReview.value = false;
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
    
    const tooltipContent = `
      <div style="font-family: inherit; font-size: 13px;">
        <b>${event.extendedProps.userName}</b><br/>
        <b>Community:</b> ${event.extendedProps.communityName}<br/>
        <b>Wax:</b> ${event.extendedProps.useWax ? '<span style="color:#b45309;font-weight:700">YES</span>' : 'NO'}<br/>
        <b>Unit number:</b> ${event.extendedProps.unitNumber}<br/>
        <b>Date:</b> ${formatDate(event.extendedProps.date)}<br/>
        <b>Type:</b> ${event.extendedProps.type}<br/>
        <b>Status:</b> ${event.extendedProps.status}
        ${event.extendedProps.suggestedName ? `
          <div style="margin-top: 6px; padding: 6px 8px; border-radius: 6px; background: #f5f3ff; color: #5b21b6; font-size: 12px;">
            <b>Sugerido:</b> ${escapeHtml(event.extendedProps.suggestedName)}<br/>
            <span style="color: #6b7280;">${escapeHtml(event.extendedProps.suggestedReason)}</span>
          </div>
        ` : ''}
        ${canShowButton && serviceInfo ? `
          <br/><br/>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button 
              id="service-modal-btn-${event.id}" 
              style="
                background-color: #007bff; 
                color: white; 
                border: none; 
                padding: 5px 10px; 
                border-radius: 4px; 
                cursor: pointer; 
                font-size: 12px;
              "
              onmouseover="this.style.backgroundColor='#0056b3'"
              onmouseout="this.style.backgroundColor='#007bff'"
            >
              Ver Detalles
            </button>
            ${serviceInfo.qaFlagged ? `
              <button
                id="service-qa-flag-btn-${event.id}"
                style="
                  background-color: #6b7280;
                  color: white;
                  border: none;
                  padding: 5px 10px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                "
              >
                Quitar marca QA${serviceInfo.kdsDay ? ` (${QA_DAY_SHORT_LABELS[serviceInfo.kdsDay]})` : ''}
              </button>
            ` : `
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="font-size: 11px; color: #9a3412; font-weight: 600;">QA:</span>
                ${KDS_DAYS.map((day) => `
                  <button
                    id="service-qa-day-btn-${event.id}-${day}"
                    style="
                      background-color: #f97316;
                      color: white;
                      border: none;
                      padding: 5px 7px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 11px;
                      font-weight: 600;
                    "
                  >
                    ${QA_DAY_SHORT_LABELS[day]}
                  </button>
                `).join('')}
              </span>
            `}
            ${canDelete ? `
              <button 
                id="service-delete-btn-${event.id}" 
                style="
                  background-color: #dc2626; 
                  color: white; 
                  border: none; 
                  padding: 5px 10px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 12px;
                "
                onmouseover="this.style.backgroundColor='#b91c1c'"
                onmouseout="this.style.backgroundColor='#dc2626'"
              >
                Eliminar
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    tippy(info.el, {
      content: tooltipContent,
      allowHTML: true,
      placement: 'top',
      trigger: 'mouseenter',
      interactive: true,
      theme: 'custom-tooltip',
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
  border-radius: 8px;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-tight);
  color: var(--ink-800);
}

.tippy-box[data-theme="custom-tooltip"] .tippy-arrow {
  color: #ffffff;
}

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
