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
    schedule: '00:00',
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

const scheduleDate = ref<Date>(moment().startOf('day').toDate());

const isFormSubmitted = ref(false);

const communities = ref<Community[]>([]);
const typesByCommunity = ref<TypeByCommunity[]>([]);
const statuses = ref<Statuses>({ data: [], meta: genericNullObject.meta });
const extras = ref<Extras>({ data: [], meta: genericNullObject.meta });
const cleaners = ref<Users>({ data: [], meta: genericNullObject.meta });
const activeAssigneeIds = ref<Set<string>>(new Set());


const loadOptions = async () => {
    // Fetch all data with pagination handling
    const [allCommunities, allStatuses, allExtras, allUsers, activeIds] = await Promise.all([
        getAllCommunities(),
        getAllStatuses(),
        getAllExtras(),
        getAllUsers(),
        UsersServices.getActiveAssigneeIds(3),
    ]);
    
    communities.value = allCommunities.data.sort((a, b) => a.communityName.localeCompare(b.communityName));
    statuses.value = allStatuses;
    extras.value = allExtras;
    cleaners.value = allUsers;
    activeAssigneeIds.value = new Set(activeIds);
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
        data: allCommunities,
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
    
    // Filter only users with roleId "4" (Cleaners) or "7" (QA)
    const cleanersOnly = allUsers.filter(user => user.roleId === "4" || user.roleId === "7");
    
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

const getTypesByCommunity = async (communityId: string) => {
    if (communityId) {
        const types = await TypesServices.getTypesByCommunity(communityId);
        typesByCommunity.value = types;
    }
};

const assigneeOptions = ref<{ label: string; value: string }[]>([]);

watch(
    () => [cleaners.value.data, activeAssigneeIds.value],
    () => {
        const activeSet = activeAssigneeIds.value;
        const sorted = [...cleaners.value.data].sort((a, b) => {
            const aActive = activeSet.has(a.id);
            const bActive = activeSet.has(b.id);
            if (aActive !== bActive) {
                return aActive ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        assigneeOptions.value = sorted.map((cleaner) => ({
            label: `${cleaner.name} (${activeSet.has(cleaner.id) ? 'active' : 'inactive'})`,
            value: cleaner.id,
        }));
    },
    { immediate: true, deep: true },
);


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
        schedule: '00:00',
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

    scheduleDate.value = moment().startOf('day').toDate();



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

            <!-- Campo: Limpiador / QA -->
            <MyInputGroup v-if="userStore.userData?.roleId === '1'" :required="false" v-model="newService.userId" label="Cleaner / QA" inputId="userId"
                inputType="select" :options="assigneeOptions"
                :is-form-submitted="isFormSubmitted" />

            <!-- Campo: Comentario -->
            <MyInputGroup :required="false" v-model="newService.comment" label="Comment" inputId="comment"
                inputType="textarea" :is-form-submitted="isFormSubmitted" :max-height="'150px'" :auto-resize="false" />

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
