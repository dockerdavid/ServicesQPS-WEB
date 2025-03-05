<script lang="ts" setup>
import { ref } from 'vue';

import moment from 'moment';

import { Button, DatePicker, FloatLabel, IconField, InputIcon, InputText, Select, Textarea } from 'primevue';

import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';

import type CreateServiceData from '@/interfaces/services/new-service.interface';

const newService = ref<CreateServiceData>({
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

const communityOptions = ref([
    { label: 'Community 1', value: 'community1' },
    { label: 'Community 2', value: 'community2' },
    { label: 'Community 3', value: 'community3' },
]);

const typeOptions = ref([
    { label: 'Type A', value: 'typeA' },
    { label: 'Type B', value: 'typeB' },
    { label: 'Type C', value: 'typeC' },
]);

const statusOptions = ref([
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
]);

const extrasOptions = ref([
    { label: 'Extra 1', value: 'extra1' },
    { label: 'Extra 2', value: 'extra2' },
]);

const cleanerOptions = ref([
    { label: 'Cleaner 1', value: 'cleaner1' },
    { label: 'Cleaner 2', value: 'cleaner2' },
]);

</script>

<template>
    <CreateLayout>
        <template #view-title>
            Create service
        </template>

        <template #inputs>

            <MyInputGroup inputType="datepicker" label="Date" inputId="date" v-model="newService.date"
                icon="calendar" />

            <MyInputGroup inputType="datepicker" label="Schedule" inputId="schedule" v-model="newService.schedule"
                icon="clock" :hourFormat="true" :timeOnly="true" />

            <MyInputGroup inputType="select" label="Unit size" inputId="unit-size" v-model="newService.unitySize" />

            <MyInputGroup inputType="input" label="Unit number" inputId="unit-number" v-model="newService.unitNumber"
                icon="address-book" />

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

            <!-- <MyInputGroup inputType="textarea" label="Comment" inputId="comment" v-model="newService.comment"
                style="resize:none;" /> -->


            <div />

            <div>
                <Button>Create</Button>
            </div>

        </template>

    </CreateLayout>
</template>

<style lang="scss" scoped></style>
