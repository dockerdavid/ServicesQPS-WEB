<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import { CleanersServices } from './services.services';
import moment from 'moment';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { Breadcrumb, useToast, DatePicker, MultiSelect } from 'primevue';
import { computed, onMounted, ref, watch } from 'vue';
import { showToast } from '../../utils/show-toast';
import type { Communities } from '../../interfaces/communities/communities.interface';
import type { EditService, Service, TypeByCommunity } from '../../interfaces/services/services.interface';
import type { Statuses } from '../../interfaces/statuses/statuses.interface';
import type { Extras } from '../../interfaces/extras/extras.interface';
import type { Users } from '../../interfaces/users/users.interface';
import genericNullObject from '../../utils/null-data-meta';
import { useUserStore } from '../../../src/store/user.store';

const toast = useToast();
const route = useRoute();
const entityId = route.params.id as string;

const userStore = useUserStore();

const breadcrumbRoutes = [
  { label: 'Services', to: { name: 'services-default' } },
  { label: 'Edit', to: { name: 'services-edit' } },
];

const isFormSubmitted = ref(false);


const scheduleDate = ref<Date>(moment().toDate());

const fillInitialData = (service: Service) => {
  updatedService.value = {
    date: service.date,
    schedule: service.schedule,
    comment: service.comment || '',
    communityId: service.communityId,
    extraId: service.extrasByServices.map(extra => extra.extraId),
    statusId: service.statusId,
    typeId: service.typeId,
    unitNumber: service.unitNumber,
    unitySize: service.unitySize,
    userComment: service.userComment || '',
    userId: service.userId || '',
  };

  scheduleDate.value = moment(service.schedule, 'HH:mm:ss').toDate();
};

const updatedService = ref<EditService>({
  date: moment().format('YYYY-MM-DD'),
  schedule: moment().format('HH:mm:ss'), 
  comment: '',
  communityId: '',
  extraId: [],
  statusId: '',
  typeId: '',
  unitNumber: '',
  unitySize: '',
  userComment: '',
  userId: '',
});

const communities = ref<Communities>(genericNullObject);
const typesByCommunity = ref<TypeByCommunity[]>([]);
const statuses = ref<Statuses>(genericNullObject);
const extras = ref<Extras>(genericNullObject);
const cleaners = ref<Users>(genericNullObject);

const communityOptions = computed(() => {
  return communities.value.data.map((community) => {
    return {
      label: community.communityName,
      value: community.id,
    };
  });
});

const typeOptions = computed(() => {
  return typesByCommunity.value.map((type: TypeByCommunity) => {
    return {
      label: `${type.cleaningType} (${type.description})`,
      value: type.id,
    };
  });
});

const statusOptions = computed(() => {
  return statuses.value.data.map((status) => {
    return {
      label: status.statusName,
      value: status.id,
    };
  });
});

const extrasOptions = computed(() => {
  return extras.value.data.map((extra) => {
    return {
      label: extra.item,
      value: extra.id,
    };
  });
});

const cleanerOptions = computed(() => {
  return cleaners.value.data.map((cleaner) => {
    return {
      label: cleaner.name,
      value: cleaner.id,
    };
  });
});

const unitSizeOptions = [
  { label: 'N/A', value: 'N/A' },
  { label: '1 Bedroom', value: '1 Bedroom' },
  { label: '2 Bedroom', value: '2 Bedroom' },
  { label: '3 Bedroom', value: '3 Bedroom' },
  { label: '4 Bedroom', value: '4 Bedroom' },
  { label: '5 Bedroom', value: '5 Bedroom' },
];

const getTypesByCommunity = async () => {
  if (updatedService.value.communityId) {
    const types = await TypesServices.getTypesByCommunity(updatedService.value.communityId);
    typesByCommunity.value = types;
  }
};

watch(() => updatedService.value.communityId, (newCommunityId) => {
  if (newCommunityId) {
    getTypesByCommunity();
  }
});

watch(
  () => scheduleDate.value,
  (newScheduleDate) => {
    if (newScheduleDate) {
      updatedService.value.schedule = moment(newScheduleDate).format('HH:mm:ss');
    }
  }
);

const updateService = async () => {

  isFormSubmitted.value = true;

  const requiredFields = [
    { field: updatedService.value.communityId, label: 'Community' },
    { field: updatedService.value.typeId, label: 'Type' },
    { field: updatedService.value.statusId, label: 'Status' },
    { field: updatedService.value.date, label: 'Date' },
    { field: updatedService.value.unitNumber, label: 'Unit number' },
  ];

  const missingFields = requiredFields.filter((field) => !field.field).map((field) => field.label);

  if (missingFields.length > 0) {
    showToast(toast, {
      severity: 'error',
      summary: 'Missing required fields',
      detail: `The following fields are required: ${missingFields.join(', ')}`,
    });
    return;
  }


  try {

    const payload = {
      ...updatedService.value,
      unitNumber: updatedService.value.unitNumber.toString(),
    };

    if (payload.userId === "" || payload.userId === undefined) {
      delete payload.userId
    }

    if(userStore.userData?.roleId === "3"){
      delete payload.userId
    }

    await CleanersServices.updateService(entityId, payload);
    showToast(toast, { severity: 'success', detail: 'Service was updated' });
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Service wasn't updated" });
  } finally {
    isFormSubmitted.value = false;
  }
};

const loadInitialData = async () => {
  const [allCommunities, allStatuses, allExtras, allUsers, initialData] = await Promise.all([
    getAllCommunities(),
    getAllStatuses(),
    getAllExtras(),
    getAllUsers(),
    CleanersServices.getServiceById(entityId)
  ]);

  communities.value = allCommunities;
  statuses.value = allStatuses;
  extras.value = allExtras;
  cleaners.value = allUsers;
  fillInitialData(initialData);
};

const getAllCommunities = async () => {
  let allCommunities: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const response = await CommunitiesServices.getCommunities(currentPage, 50);
    allCommunities = [...allCommunities, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }
  
  return {
    data: allCommunities.sort((a, b) => a.communityName.localeCompare(b.communityName)),
    meta: {
      page: 1,
      take: allCommunities.length,
      totalCount: allCommunities.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };
};

const getAllStatuses = async () => {
  let allStatuses: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const response = await StatusesServices.getStatuses(currentPage, 50);
    allStatuses = [...allStatuses, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }
  
  return {
    data: allStatuses,
    meta: {
      page: 1,
      take: allStatuses.length,
      totalCount: allStatuses.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };
};

const getAllExtras = async () => {
  let allExtras: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const response = await ExtrasServices.getExtras(currentPage, 50);
    allExtras = [...allExtras, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }
  
  return {
    data: allExtras,
    meta: {
      page: 1,
      take: allExtras.length,
      totalCount: allExtras.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };
};

const getAllUsers = async () => {
  let allUsers: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const response = await UsersServices.getUsers(currentPage, 50);
    allUsers = [...allUsers, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }
  
  // Filter only users with roleId "4" (Cleaners)
  const cleanersOnly = allUsers.filter(user => user.roleId === "4");
  
  return {
    data: cleanersOnly,
    meta: {
      page: 1,
      take: cleanersOnly.length,
      totalCount: cleanersOnly.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false
    }
  };
};

onMounted(async () => {
  await loadInitialData();
});
</script>

<template>
  <div class="py-6">
    <Breadcrumb :model="breadcrumbRoutes">
      <template #item="{ item, props }">
        <router-link v-if="item.to" v-slot="{ href, navigate }" :to="item.to" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span :class="[item.icon, 'text-color']" />
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>

    <h1 class="text-3xl">Edit service</h1>
  </div>

  <form class="form-grid">
    <!-- Campo: Fecha -->
    <MyInputGroup v-model="updatedService.date" label="Date" inputType="datepicker" inputId="date"
      :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Horario -->
    <fieldset>
      <label for="schedule">Schedule</label>
      <DatePicker v-model="scheduleDate" :time-only="true" hour-format="12" id="schedule" />
    </fieldset>

    <!-- Campo: Tamaño de la unidad -->
    <MyInputGroup v-model="updatedService.unitySize" label="Unit size" inputType="select" inputId="unit-size"
      :options="unitSizeOptions" :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Número de unidad -->
    <MyInputGroup v-model="updatedService.unitNumber" label="Unit number" inputType="input" inputId="unit-number"
      :is-form-submitted="isFormSubmitted" input-numeric-mode="decimal" />

    <!-- Campo: Comunidad -->
    <MyInputGroup v-model="updatedService.communityId" label="Community" inputType="select" inputId="community"
      :options="communityOptions" :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Tipo de servicio -->
    <MyInputGroup v-model="updatedService.typeId" label="Type" inputType="select" inputId="type" :options="typeOptions"
      :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Estado -->
    <MyInputGroup v-model="updatedService.statusId" label="Status" inputType="select" inputId="status"
      :options="statusOptions" :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Extras -->
    <fieldset>
      <label for="extras">Extras</label>
      <MultiSelect v-model="updatedService.extraId" :options="extras.data.map((e) => ({ label: e.item, value: e.id }))" optionLabel="label" optionValue="value"
        placeholder="Select Extras" class="w-full md:w-80" />
    </fieldset>

    <!-- Campo: Limpiador -->
    <MyInputGroup v-if="userStore.userData?.roleId === '1'" v-model="updatedService.userId" label="Cleaner"
      inputType="select" inputId="cleaner" :required="false" :options="cleanerOptions"
      :is-form-submitted="isFormSubmitted" />

    <!-- Campo: Comentario -->
    <MyInputGroup :required="false" v-model="updatedService.comment" label="Comment" inputType="textarea" inputId="comment"
      :is-form-submitted="isFormSubmitted" :max-height="'150px'" :auto-resize="false" />
  </form>

  <!-- Botón de actualización -->
  <LoadingButton label="Edit" @click="updateService" />
</template>


<style scoped lang="scss">
.form-grid {

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}


@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    grid-auto-flow: dense;
  }
}
</style>