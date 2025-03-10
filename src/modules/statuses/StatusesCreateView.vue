<script setup lang="ts">
import { ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '../../layouts/CreateLayout.vue';

import { useToast } from 'primevue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { StatusesServices } from './statuses.services';
import { showToast } from '../../utils/show-toast';

const statusName = ref('');
const toast = useToast();

const breadcrumbRoutes = [
    { label: 'Statuses', to: { name: 'statuses-default' } },
    { label: 'Create', to: { name: 'statuses-create' } },
];

const createStatus = async () => {

    try {
        console.log(statusName.value)
        await StatusesServices.createStatus(statusName.value);
        showToast(toast, { severity: 'success', summary: 'Status created' })
        statusName.value = '';
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Status wasn't created" })
    }
}

</script>


<template>

    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title>Create Status</template>

        <template #inputs>

            <MyInputGroup v-model="statusName" input-type="input" input-id="name" label="Status name" />

            <div />

            <div>
                <LoadingButton @click="createStatus" />
            </div>

        </template>

    </CreateLayout>

</template>
