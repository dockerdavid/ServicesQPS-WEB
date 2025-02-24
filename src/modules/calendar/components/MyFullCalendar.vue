<template>
  <FullCalendar :options="calendarOptions" ref="fullCalendar" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Configuración del calendario
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: [
    { title: 'Event 1', date: '2023-10-01' },
    { title: 'Event 2', date: '2023-10-05' },
  ],
  editable: true,
  selectable: true,
  dateClick: (info: any) => {
    alert('Fecha seleccionada: ' + info.dateStr);
  },
  eventClick: (info: any) => {
    alert('Evento seleccionado: ' + info.event.title);
  },
});

// Referencia al calendario
const fullCalendar = ref<typeof FullCalendar | null>(null);

// Exponer la API de FullCalendar
defineExpose({
  getApi: () => fullCalendar.value?.getApi(),
});
</script>

<style>
.fc {
  width: 100%;
  margin: 0 auto;
}
</style>