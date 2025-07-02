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
          </div>
          
          <div class="info-group">
            <h3 class="font-bold text-lg mb-2">Servicio</h3>
            <p><strong>Tipo:</strong> {{ selectedServiceInfo.type?.cleaningType || 'N/A' }}</p>
            <p><strong>Descripción:</strong> {{ selectedServiceInfo.type?.description || 'N/A' }}</p>
            <p><strong>Precio:</strong> ${{ selectedServiceInfo.type?.price || 'N/A' }}</p>
            <p><strong>Comisión:</strong> {{ selectedServiceInfo.type?.commission || 'N/A' }}</p>
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
import { useUserStore } from '../../../store/user.store';
import { Dialog, Button, InputSwitch, Textarea } from 'primevue';

const router = useRouter();
const userStore = useUserStore();

const filterType = ref('');
const filterText = ref('');
const allEvents = ref<CalendarInterface[]>([]);
const calendarEvents = ref<EventInput[]>([]);

// Estado para el modal
const showServiceModal = ref(false);
const selectedServiceInfo = ref<CalendarInterface | null>(null);

// Estado para los datos de review
const reviewData = ref<any[]>([]);

// Estado para el comentario del review
const reviewComment = ref('');

const isSavingReview = ref(false);

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

const reloadCalendarEvents = async () => {
  let events = await CalendarServices.getCalendarData();
  if (userStore.userData?.roleId === '7') {
    events = events.filter(ev => ['3', '5', '6'].includes(ev.statusId));
  }
  allEvents.value = events;
  calendarEvents.value = events.map(eventToCalendarEvent);
  calendarOptions.value.events = calendarEvents.value;
};

const openServiceModal = async (serviceInfo: CalendarInterface) => {
  selectedServiceInfo.value = serviceInfo;
  // Obtener los items de review dinámicamente
  const data = await CalendarServices.getReviewItemsWithClasses();
  const serviceReviews = serviceInfo.reviews || [];
  if (Array.isArray(data)) {
    // Asegurarse que todos los items tengan un campo 'checked' según la review del servicio
    reviewData.value = data.map((cls: any) => ({
      ...cls,
      reviewItems: cls.reviewItems.map((item: any) => {
        const found = serviceReviews.find((r: any) => r.reviewItemId === item.id);
        return {
          ...item,
          checked: found ? found.value === 1 : false
        };
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
  // Preparar payload para el endpoint
  const serviceId = selectedServiceInfo.value?.id || '';
  const message = reviewComment.value;
  const reviewItemsPayload: { reviewItemId: string, value: boolean }[] = [];
  reviewData.value.forEach((cls: any) => {
    cls.reviewItems.forEach((item: any) => {
      reviewItemsPayload.push({
        reviewItemId: item.id,
        value: !!item.checked
      });
    });
  });
  if (serviceId) {
    await CalendarServices.postServiceReview({
      serviceId,
      message,
      reviewItems: reviewItemsPayload
    });
  }
  showServiceModal.value = false;
  selectedServiceInfo.value = null;
  // Resetear el comentario
  reviewComment.value = '';
  // Resetear los checks
  reviewData.value = reviewData.value.map((cls: any) => ({
    ...cls,
    reviewItems: cls.reviewItems.map((item: any) => ({ ...item, checked: false }))
  }));
  isSavingReview.value = false;
  // Recargar los servicios y el calendario
  await reloadCalendarEvents();
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
    // Verificar si el usuario tiene rol '7' - si es así, no permitir acceso
    if (userStore.userData?.roleId === '7') {
      return; // No hacer nada, no redirigir
    }
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
    const event = info.event;
    const serviceInfo = allEvents.value.find(ev => ev.id === event.id);
    
    // Verificar si el usuario puede ver el botón (roles 1 y 7)
    const canShowButton = userStore.userData?.roleId === '1' || userStore.userData?.roleId === '7';
    
    const tooltipContent = `
      <div style="font-family: inherit; font-size: 13px;">
        <b>${event.extendedProps.userName}</b><br/>
        <b>Community:</b> ${event.extendedProps.communityName}<br/>
        <b>Unit number:</b> ${event.extendedProps.unitNumber}<br/>
        <b>Date:</b> ${formatDate(event.extendedProps.date)}<br/>
        <b>Type:</b> ${event.extendedProps.type}<br/>
        <b>Status:</b> ${event.extendedProps.status}
        ${canShowButton && serviceInfo ? `
          <br/><br/>
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
              button.addEventListener('click', () => {
                openServiceModal(serviceInfo);
                instance.hide();
              });
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
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

onMounted(async () => {
  let events = await CalendarServices.getCalendarData();
  // Si el usuario es roleId 7, filtrar por statusId 3, 5, 6
  if (userStore.userData?.roleId === '7') {
    events = events.filter(ev => ['3', '5', '6'].includes(ev.statusId));
  }
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

.service-info {
  max-height: 70vh;
  overflow-y: auto;
}

.info-group {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-group h3 {
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.info-group p {
  margin: 0.5rem 0;
  line-height: 1.4;
}

.info-group strong {
  color: #495057;
}

.review-section {
  border-left: 3px solid #007bff;
  padding-left: 1rem;
}

.review-section h4 {
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #007bff;
}

.review-section .flex {
  transition: background-color 0.2s ease;
}

.review-section .flex:hover {
  background-color: #e9ecef !important;
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