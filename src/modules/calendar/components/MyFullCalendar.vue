<template>
  <div>
    <FullCalendar :options="calendarOptions" ref="fullCalendar" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useRouter } from 'vue-router';
import type { CalendarInterface } from '../../../interfaces/calendar/calendar.interface';
import { CalendarServices } from '../calendar.services';
import type { EventInput } from '@fullcalendar/core/index.js';
import tippy from 'tippy.js'; // Importa Tippy.js
import 'tippy.js/dist/tippy.css'; // Importa los estilos de Tippy.js

const router = useRouter();

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  events: [] as EventInput[],
  editable: false,
  selectable: false,
  eventClick: (info: any) => {
    router.push(`/services/edit/${info.event.id}`);
  },
  eventContent: (arg: any) => {
    const event = arg.event;
    return {
      html: `
        <div class="whitespace-normal">
          <p>${event.extendedProps.userName}</p>
          <p class=" "">${event.extendedProps.communityName}</p>
        </div>
      `,
    };
  },
  eventDidMount: (info: any) => {
    tippy(info.el, {
      content: `
        <div class="p-2"> 
          <p style="font-weight: 600">${info.event.extendedProps.userName} (${info.event.extendedProps.communityName || 'N/A'})</p>
          <p> <p style="font-weight: 600" > Date: </p> ${info.event.start.toLocaleDateString()}</p>
          <p> <p style="font-weight: 600" > Type: </p> ${info.event.extendedProps.type}</p>
          <p> <p style="font-weight: 600" > Status: </p> ${info.event.extendedProps.status}</p>
        </div>
      `,
      allowHTML: true,
      placement: 'top',
      trigger: 'mouseenter',
      interactive: true,
      theme: 'custom-tooltip'
    });
  },
});

const getEventColor = (statusId: number): string => {
  const colors = ['#18ad32', '#18ad32', '#18ad32', '#AE33A1', '#A133FF', '#A29AA1'];
  return colors[statusId];
};

onMounted(async () => {
  const events = await CalendarServices.getCalendarData();
  if (events.length > 0) {
    calendarOptions.value.events = events.map((event: CalendarInterface) => ({
      id: event.id,
      date: event.date,
      color: getEventColor(parseInt(event.statusId)),
      extendedProps: {
        userName: event.user.name,
        communityName: event.community?.communityName || 'N/A',
        status: event.status.statusName,
        type: event.type.cleaningType,
      },
    }));
  }
});

const fullCalendar = ref<typeof FullCalendar | null>(null);

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