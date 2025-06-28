<template>
  <div>
    <!-- Filtro global con diseño consistente -->
    <div class="flex items-end mb-4 gap-2">
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
    </div>
    <div>
      <FullCalendar :options="calendarOptions" ref="fullCalendar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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

const router = useRouter();

const filterType = ref('');
const filterText = ref('');
const allEvents = ref<CalendarInterface[]>([]);
const calendarEvents = ref<EventInput[]>([]);

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

const applyFilter = () => {
  if (!filterType.value || !filterText.value.trim()) {
    // Sin filtro, mostrar todo
    calendarEvents.value = allEvents.value.map(eventToCalendarEvent);
    calendarOptions.value.events = calendarEvents.value;
    return;
  }
  const text = filterText.value.trim().toLowerCase();
  let filtered: CalendarInterface[] = [];
  if (filterType.value === 'cleaner') {
    filtered = allEvents.value.filter(ev => (ev.user?.name || '').toLowerCase().includes(text));
  } else if (filterType.value === 'unit') {
    filtered = allEvents.value.filter(ev => (ev.unitNumber || '').toLowerCase().includes(text));
  } else if (filterType.value === 'community') {
    filtered = allEvents.value.filter(ev => (ev.community?.communityName || '').toLowerCase().includes(text));
  }
  calendarEvents.value = filtered.map(eventToCalendarEvent);
  calendarOptions.value.events = calendarEvents.value;
};

const clearFilter = () => {
  filterText.value = '';
  applyFilter();
};

const eventToCalendarEvent = (event: CalendarInterface): EventInput => ({
  id: event.id,
  date: event.date,
  color: getEventColor(event.status?.statusName),
  extendedProps: {
    userName: event.user?.name || 'N/A',
    communityName: event.community?.communityName || 'N/A',
    status: event.status?.statusName || 'N/A',
    type: event.type?.cleaningType || 'N/A',
    unitNumber: event.unitNumber || 'N/A',
    date: event.date,
  },
});

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: calendarEvents.value,
  editable: false,
  selectable: false,
  eventClick: (info: any) => {
    router.push(`/services/edit/${info.event.id}`);
  },
  eventContent: (arg: any) => {
    const event = arg.event;
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
        </div>
      `,
    };
  },
  eventDidMount: (info: any) => {
    tippy(info.el, {
      content: info.event._def.extendedProps ? info.event._def.extendedProps : '',
      allowHTML: true,
      placement: 'top',
      trigger: 'mouseenter',
      interactive: true,
      theme: 'custom-tooltip'
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
    default: return '#00a7b2';
  }
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

onMounted(async () => {
  const events = await CalendarServices.getCalendarData();
  allEvents.value = events;
  calendarEvents.value = events.map(eventToCalendarEvent);
  calendarOptions.value.events = calendarEvents.value;
});

const fullCalendar = ref<typeof FullCalendar | null>(null);

// Watcher para limpiar el filtro automáticamente si el input queda vacío
watch(filterText, (newVal) => {
  if (newVal === '') {
    applyFilter();
  }
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

.tippy-box[data-theme="custom-tooltip"] {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid black;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: black;
}

.tippy-box[data-theme="custom-tooltip"] .tippy-arrow {
  color: #ffffff;
}
</style>