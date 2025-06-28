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
      :style="{ width: '50vw' }"
      :closable="true"
      @hide="closeServiceModal"
    >
      <div v-if="selectedServiceInfo" class="service-info">
        <div class="grid grid-cols-2 gap-4">
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
          
          <!-- Entry -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Entry:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.entry" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.entry[item]" />
              </div>
            </div>
          </div>
          
          <!-- All Room Items -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">All Room Items:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.allRoomItems" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.allRoomItems[item]" />
              </div>
            </div>
          </div>
          
          <!-- Patio/Balcony -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Patio/Balcony:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.patioBalcony" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.patioBalcony[item]" />
              </div>
            </div>
          </div>
          
          <!-- Laundry -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Laundry:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.laundry" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.laundry[item]" />
              </div>
            </div>
          </div>
          
          <!-- Dining Room -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Dining Room:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.diningRoom" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.diningRoom[item]" />
              </div>
            </div>
          </div>
          
          <!-- A/C Cabinet -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">A/C Cabinet:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.acCabinet" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.acCabinet[item]" />
              </div>
            </div>
          </div>
          
          <!-- Kitchen -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Kitchen:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.kitchen" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.kitchen[item]" />
              </div>
            </div>
          </div>
          
          <!-- Bathrooms -->
          <div class="review-section mb-4">
            <h4 class="font-semibold text-md mb-2 text-blue-600">Bathrooms:</h4>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(value, item) in reviewItems.bathrooms" :key="item" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span class="text-sm">{{ item }}</span>
                <InputSwitch v-model="reviewItems.bathrooms[item]" />
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
        <Button label="Cerrar" @click="closeServiceModal" class="p-button-secondary" />
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

// Estado para los switches de review
const reviewItems = ref<Record<string, Record<string, boolean>>>({
  entry: {
    'Back Door': false,
    'Light Switches': false
  },
  allRoomItems: {
    'Outlets': false,
    'Light Switches': false,
    'Windows': false,
    'Blinds': false,
    'Baseboard': false,
    'Ceiling Fans': false,
    'Door': false,
    'Vents': false
  },
  patioBalcony: {
    'Door': false,
    'Light Fixture': false,
    'Exterior': false,
    'Outlets': false,
    'Railings secure': false
  },
  laundry: {
    'Washing Machine': false,
    'Dryer': false,
    'Dryer Vent Clean': false,
    'Shelving': false,
    'Floor': false,
    'Baseboard': false,
    'Vents': false
  },
  diningRoom: {
    'Ceiling Fans': false,
    'Baseboard': false,
    'Windows': false,
    'Blinds': false,
    'Light Switches': false,
    'Outlets': false,
    'Floor': false
  },
  acCabinet: {
    'Door': false,
    'Vent': false
  },
  kitchen: {
    'Refrigerator-door gasket sealed': false,
    'Refrigerator- Grills': false,
    'Polish Refrigerator': false,
    'Dishwasher': false,
    'Microwave': false,
    'Counter Tops': false,
    'Cabinets': false,
    'Faucets': false,
    'Backsplash/Tile': false,
    'Kitchen Sink': false,
    'Basket strainers': false,
    'Range Top': false,
    'Oven': false,
    'Refrigerator Back': false,
    'Range Back': false,
    'Lamps and Light Bulbs': false,
    'Vents': false
  },
  bathrooms: {
    'Sinks': false,
    'Sinks Faucets': false,
    'Sink Pop-Ups': false,
    'Handles and Index Buttons': false,
    'Bath/ Shower': false,
    'Shower Door': false,
    'Bath Shower Faucets': false,
    'Shower Heads': false,
    'Tile': false,
    'Tub Drains': false,
    'Toilets': false,
    'Mirrors': false,
    'Countertops': false,
    'Cabinets': false,
    'Shelving': false,
    'Bath Hardware': false,
    'Exhaust Fan': false,
    'Floors': false
  }
});

// Estado para el comentario del review
const reviewComment = ref('');

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

const openServiceModal = (serviceInfo: CalendarInterface) => {
  selectedServiceInfo.value = serviceInfo;
  showServiceModal.value = true;
};

const closeServiceModal = () => {
  showServiceModal.value = false;
  selectedServiceInfo.value = null;
  
  // Resetear todos los switches
  Object.keys(reviewItems.value).forEach(category => {
    Object.keys(reviewItems.value[category]).forEach(item => {
      reviewItems.value[category][item] = false;
    });
  });
  
  // Resetear el comentario
  reviewComment.value = '';
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
</style>