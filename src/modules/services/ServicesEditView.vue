<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
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
const router = useRouter();
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

 scheduleDate.value = moment(service.schedule || moment(), 'HH:mm:ss').toDate();
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
  console.log('Communities data:', communities.value.data);
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
  const filteredCleaners = cleaners.value.data.filter(cleaner => cleaner.roleId === "4");
  console.log('Total cleaners:', filteredCleaners.length);
  console.log('Cleaners list:', filteredCleaners.map(c => c.name));
  
  return filteredCleaners.map((cleaner) => {
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

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    take: number;
    totalCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

const fetchAllPaginatedData = async <T>(
  fetchFunction: (page: number, take: number) => Promise<PaginatedResponse<T>>,
  pageSize: number = 50
): Promise<PaginatedResponse<T>> => {
  let allData: T[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  let lastMeta: PaginatedResponse<T>['meta'];

  while (hasNextPage) {
    const response = await fetchFunction(currentPage, pageSize);
    allData = [...allData, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    lastMeta = response.meta;
    currentPage++;
  }

  return {
    data: allData,
    meta: {
      ...lastMeta!,
      page: currentPage - 1,
      take: pageSize,
      totalCount: allData.length,
      pageCount: currentPage - 1,
      hasPreviousPage: currentPage > 1,
      hasNextPage: false
    }
  };
};

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

const deleteService = async () => {
  try {
    await CleanersServices.deleteService(entityId);
    showToast(toast, { severity: 'success', detail: 'Service was deleted successfully' });
    router.push('/services');
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Service couldn't be deleted" });
  }
};

onMounted(async () => {
  try {
    const [communityResults, statusResults, extrasResults, initialData] = await Promise.all([
      fetchAllPaginatedData(CommunitiesServices.getCommunities),
      fetchAllPaginatedData(StatusesServices.getStatuses),
      fetchAllPaginatedData(ExtrasServices.getExtras),
      CleanersServices.getServiceById(entityId)
    ]);

    // Fetch all users separately since it requires pagination
    const cleanerResults = await fetchAllPaginatedData(UsersServices.getUsers);

    communities.value = communityResults;
    statuses.value = statusResults;
    extras.value = extrasResults;
    cleaners.value = cleanerResults;
    fillInitialData(initialData);

    // Log counts for debugging
    console.log('Total communities:', communities.value.data.length);
    console.log('Total statuses:', statuses.value.data.length);
    console.log('Total extras:', extras.value.data.length);
    console.log('Total users:', cleaners.value.data.length);
    console.log('Total cleaners:', cleaners.value.data.filter(u => u.roleId === "4").length);
  } catch (error) {
    console.error('Error loading data:', error);
    showToast(toast, { 
      severity: 'error', 
      summary: 'Error loading data',
      detail: 'There was an error loading the service data. Please try again.'
    });
  }
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
      <DatePicker v-model="scheduleDate" time-only id="schedule" />
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
    <MyInputGroup :required="false" v-model="updatedService.comment" label="Comment" inputType="input" inputId="comment"
      :is-form-submitted="isFormSubmitted" />
  </form>

  <!-- Botón de actualización -->
  <div class="button-container">
    <LoadingButton label="Edit" @click="updateService" />
    <LoadingButton label="Delete" severity="danger" @click="deleteService" />
  </div>
</template>


<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.button-container {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    grid-auto-flow: dense;
  }
}
</style>