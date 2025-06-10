<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import moment from 'moment';
import { DatePicker, MultiSelect, useToast } from 'primevue';
import CreateLayout from '../../layouts/CreateLayout.vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { CleanersServices } from './services.services';
import { showToast } from '../../utils/show-toast';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import type { TypeByCommunity } from '../../interfaces/services/services.interface';
import type CreateService from '../../interfaces/services/services.interface';
import type { Community } from '../../../src/interfaces/communities/communities.interface';
import type { Statuses } from '../../../src/interfaces/statuses/statuses.interface';
import type { Extras } from '../../../src/interfaces/extras/extras.interface';
import type { Users } from '../../../src/interfaces/users/users.interface';
import genericNullObject from '../../../src/utils/null-data-meta';
import router from '../../../src/router';
import { useUserStore } from '../../../src/store/user.store';
import { apiServicesQps } from '../../api/api';
import type { MetaPagination } from '../../interfaces/meta-pagination.interface';

const toast = useToast();

const userStore = useUserStore();

const breadcrumbRoutes = [
    { label: 'Services', to: { name: 'services-default' } },
    { label: 'Create', to: { name: 'services-create' } },
];

const unitSizeOptions = [
    { label: 'N/A', value: 'N/A' },
    { label: '1 Bedroom', value: '1 Bedroom' },
    { label: '2 Bedroom', value: '2 Bedroom' },
    { label: '3 Bedroom', value: '3 Bedroom' },
    { label: '4 Bedroom', value: '4 Bedroom' },
    { label: '5 Bedroom', value: '5 Bedroom' },
];


const newService = ref<CreateService>({
    date: moment().format('YYYY-MM-DD'),
    schedule: '00:00:00',
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

const scheduleDate = ref<Date>(moment().set({ hour: 0, minute: 0, second: 0 }).toDate());

const isFormSubmitted = ref(false);

const communities = ref<Community[]>([]);
const typesByCommunity = ref<TypeByCommunity[]>([]);
const statuses = ref<Statuses>({ data: [], meta: genericNullObject.meta });
const extras = ref<Extras>({ data: [], meta: genericNullObject.meta });
const cleaners = ref<Users>({ data: [], meta: genericNullObject.meta });

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: MetaPagination;
}

const fetchAllPaginatedData = async <T>(
  fetchFunction: (page: number, take: number) => Promise<ApiResponse<PaginatedResponse<T>>>,
  pageSize: number = 50
): Promise<PaginatedResponse<T>> => {
  let allData: T[] = [];
  let currentPage = 1;
  let hasNextPage = true;
  let lastMeta: PaginatedResponse<T>['meta'];

  while (hasNextPage) {
    const response = await fetchFunction(currentPage, pageSize);
    allData = [...allData, ...response.data.data];
    hasNextPage = response.data.meta.hasNextPage;
    lastMeta = response.data.meta;
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

const loadOptions = async () => {
  try {
    const [communityResults, statusResults, extrasResults, cleanerResults] = await Promise.all([
      fetchAllPaginatedData<Community>((page, take) => apiServicesQps.get(`/communities?page=${page}&take=${take}`)),
      fetchAllPaginatedData<Statuses['data'][0]>((page, take) => apiServicesQps.get(`/statuses?page=${page}&take=${take}`)),
      fetchAllPaginatedData<Extras['data'][0]>((page, take) => apiServicesQps.get(`/extras?page=${page}&take=${take}`)),
      fetchAllPaginatedData<Users['data'][0]>((page, take) => apiServicesQps.get(`/users?page=${page}&take=${take}`))
    ]);

    communities.value = communityResults.data.sort((a, b) => a.communityName.localeCompare(b.communityName));
    statuses.value = statusResults as unknown as Statuses;
    extras.value = extrasResults as unknown as Extras;
    cleaners.value = {
      ...cleanerResults as unknown as Users,
      data: cleanerResults.data
        .filter(user => user.roleId === "4")
        .sort((a, b) => a.name.localeCompare(b.name))
    };

    // Log counts for debugging
    console.log('Total communities:', communities.value.length);
    console.log('Total statuses:', statuses.value.data.length);
    console.log('Total extras:', extras.value.data.length);
    console.log('Total users:', cleanerResults.data.length);
    console.log('Total cleaners:', cleaners.value.data.length);
  } catch (error) {
    console.error('Error loading data:', error);
    showToast(toast, { 
      severity: 'error', 
      summary: 'Error loading data',
      detail: 'There was an error loading the form data. Please try again.'
    });
  }
};


const getTypesByCommunity = async (communityId: string) => {
    if (communityId) {
        const types = await TypesServices.getTypesByCommunity(communityId);
        typesByCommunity.value = types;
    }
};


watch(
    () => newService.value.communityId,
    (newCommunityId) => {
        if (newCommunityId) {
            getTypesByCommunity(newCommunityId);
        }
    }
);

watch(
    () => scheduleDate.value,
    (newScheduleDate) => {
        if (newScheduleDate) {
            newService.value.schedule = moment(newScheduleDate).format('HH:mm:ss');
        }
    }
);

const createService = async (leave: boolean) => {
    isFormSubmitted.value = true;

    const requiredFields = [
        { field: newService.value.communityId, label: 'Community' },
        { field: newService.value.typeId, label: 'Type' },
        { field: newService.value.statusId, label: 'Status' },
        { field: newService.value.date, label: 'Date' },
        { field: newService.value.unitNumber, label: 'Unit number' },
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
            ...newService.value,
            unitNumber: newService.value.unitNumber.toString(),
        };

        if(payload.userId === "" || payload.userId === undefined){
            delete payload.userId
        }

        if(payload.userId && payload.statusId === '1'){
            payload.statusId = '2'
        }

        await CleanersServices.createService(payload);
        showToast(toast, { severity: 'success', detail: 'Service was created' });
        leave ? router.back() : clearForm();
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Service wasn't created" });
    }
};

const clearForm = () => {

    isFormSubmitted.value = false

    newService.value = {
        date: moment().format('YYYY-MM-DD'),
        schedule: '00:00:00',
        comment: '',
        communityId: '',
        extraId: [],
        statusId: '',
        typeId: '',
        unitNumber: '',
        unitySize: '',
        userComment: '',
        userId: '',
    };

    scheduleDate.value = moment().set({ hour: 0, minute: 0, second: 0 }).toDate();



}

onMounted(async () => {
    await loadOptions();
});
</script>

<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
        <template #view-title>Create service</template>

        <template #inputs>
            <!-- Campo: Fecha -->
            <MyInputGroup v-model="newService.date" label="Date" inputId="date" inputType="datepicker" icon="calendar"
                :is-form-submitted="isFormSubmitted" />

            <fieldset>
                <label for="schedule">Schedule</label>
                <DatePicker v-model="scheduleDate" :time-only="true" hour-format="24" id="schedule" />
            </fieldset>

            <!-- Campo: Tamaño de la unidad -->
            <MyInputGroup v-model="newService.unitySize" label="Unit size" inputId="unitySize" inputType="select"
                :options="unitSizeOptions" :is-form-submitted="isFormSubmitted" />

            <!-- Campo: Número de unidad -->
            <MyInputGroup v-model="newService.unitNumber" label="Unit number" inputId="unitNumber" inputType="input"
                icon="address-book" :is-form-submitted="isFormSubmitted" input-numeric-mode="decimal" />

            <!-- Campo: Comunidad -->
            <MyInputGroup v-model="newService.communityId" label="Community" inputId="communityId" inputType="select"
                :options="communities.map((c) => ({ label: c.communityName, value: c.id }))" :required="true"
                :is-form-submitted="isFormSubmitted" />

            <!-- Campo: Tipo de servicio -->
            <MyInputGroup v-model="newService.typeId" label="Type" inputId="typeId" inputType="select"
                :options="typesByCommunity.map((t) => ({ label: `${t.cleaningType} (${t.description})`, value: t.id }))"
                :required="true" :is-form-submitted="isFormSubmitted" />

            <!-- Campo: Estado -->
            <MyInputGroup v-model="newService.statusId" label="Status" inputId="statusId" inputType="select"
                :options="statuses.data.map((s) => ({ label: s.statusName, value: s.id }))" :required="true"
                :is-form-submitted="isFormSubmitted" />

            <!-- Campo: Extras (Multiselect) -->
            <fieldset>
                <label for="extras">Extras</label>
                <MultiSelect v-model="newService.extraId"
                    :options="extras.data.map((e) => ({ label: e.item, value: e.id }))" optionLabel="label"
                    optionValue="value" placeholder="Select extras" class="w-full md:w-80" />
            </fieldset>

            <!-- Campo: Limpiador -->
            <MyInputGroup v-if="userStore.userData?.roleId === '1'" :required="false" v-model="newService.userId" label="Cleaner" inputId="userId"
                inputType="select" :options="cleaners.data.map((c) => ({ label: c.name, value: c.id }))"
                :is-form-submitted="isFormSubmitted" :filter="true" />

            <!-- Campo: Comentario -->
            <MyInputGroup :required="false" v-model="newService.comment" label="Comment" inputId="comment"
                inputType="input" :is-form-submitted="isFormSubmitted" />

            <!-- Botón de creación -->

            <div v-if="userStore.userData?.roleId !== '1'" />

            <div class="flex">
                <LoadingButton label="Create" @click="createService(false)" />
                <div class="px-4">
                    <LoadingButton :outlined="true" label="Create and leave" @click="createService(true)" />
                </div>
                <LoadingButton severity="danger" :outlined="true" label="Clear form" @click="clearForm" />
            </div>
        </template>
    </CreateLayout>
</template>