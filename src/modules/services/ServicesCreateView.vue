<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import { useToast } from 'primevue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import type CreateService from '@/interfaces/services/services.interface';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { CleanersServices } from './services.services';
import { showToast } from '@/utils/show-toast';
import type { Communities } from '@/interfaces/communities/communities.interface';
import genericNullObject from '@/utils/null-data-meta';
import type { Types } from '@/interfaces/types/types.interface';
import type { Statuses } from '@/interfaces/statuses/statuses.interface';
import type { Extras } from '@/interfaces/extras/extras.interface';
import type { Users } from '@/interfaces/users/users.interface';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import type { TypeByCommunity } from '@/interfaces/services/services.interface';

const toast = useToast();

const breadcrumbRoutes = [
    { label: 'Services', to: { name: 'services-default' } },
    { label: 'Create', to: { name: 'services-create' } },
];

const newService = ref<CreateService>({
    date: moment().format('YYYY-MM-DD'),
    schedule: moment().format('HH:mm:ss'),
    comment: '',
    communityId: '',
    extraId: '',
    statusId: '',
    typeId: '',
    unitNumber: '',
    unitySize: '',
    userComment: '',
    userId: ''
});

const communities = ref<Communities>(genericNullObject);
const typesByCommunity = ref<TypeByCommunity[]>([]); // Tipado como array
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
    return typesByCommunity.value.map((type: TypeByCommunity) => { // Tipar el parámetro
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
    if (newService.value.communityId) {
        const types = await TypesServices.getTypesByCommunity(newService.value.communityId);
        typesByCommunity.value = types; // Asegúrate de que `types` sea un array
    }
};

watch(() => newService.value.communityId, (newCommunityId) => {
    if (newCommunityId) {
        getTypesByCommunity();
    }
});

const createService = async () => {
    newService.value.unitNumber = newService.value.unitNumber.toString();
    try {
        await CleanersServices.createService(newService.value);
        showToast(toast, { severity: 'success', detail: 'Service was created' });
        newService.value = {
            date: moment().format('YYYY-MM-DD'),
            schedule: moment().format('HH:mm:ss'),
            comment: '',
            communityId: '',
            extraId: '',
            statusId: '',
            typeId: '',
            unitNumber: '',
            unitySize: '',
            userComment: '',
            userId: ''
        };
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Service wasn't created" });
    }
};

onMounted(async () => {
    const [communityResults, statusResults, extrasResults, cleanerResults] = await Promise.all([
        CommunitiesServices.getCommunities(),
        StatusesServices.getStatuses(),
        ExtrasServices.getExtras(),
        UsersServices.getUsers(),
    ]);

    communities.value = communityResults;
    statuses.value = statusResults;
    extras.value = extrasResults;
    cleaners.value = cleanerResults;
});
</script>


<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
        <template #view-title>
            Create service
        </template>

        <template #inputs>
            <MyInputGroup inputType="datepicker" label="Date" inputId="date" v-model="newService.date" icon="calendar" />

            <MyInputGroup inputType="datepicker" label="Schedule" inputId="schedule" v-model="newService.schedule"
                icon="clock" :hourFormat="true" :timeOnly="true" />

            <MyInputGroup :options="unitSizeOptions" inputType="select" label="Unit size" inputId="unit-size"
                v-model="newService.unitySize" />

            <MyInputGroup inputType="numeric" input-numeric-mode="decimal" label="Unit number" inputId="unit-number"
                v-model="newService.unitNumber" icon="address-book" />

            <MyInputGroup inputType="select" label="Community" inputId="community" v-model="newService.communityId"
                :options="communityOptions" />

            <MyInputGroup inputType="select" label="Type" inputId="type" v-model="newService.typeId"
                :options="typeOptions" />

            <MyInputGroup inputType="select" label="Status" inputId="status" v-model="newService.statusId"
                :options="statusOptions" />

            <MyInputGroup inputType="select" label="Extras" inputId="extras" v-model="newService.extraId"
                :options="extrasOptions" />

            <MyInputGroup inputType="select" label="Cleaner" inputId="cleaner" v-model="newService.userId"
                :options="cleanerOptions" />

            <MyInputGroup inputType="input" label="Comment" inputId="comment" v-model="newService.comment"
                style="resize:none;" />

            <div />

            <div>
                <LoadingButton @click="createService" />
            </div>
        </template>
    </CreateLayout>
</template>