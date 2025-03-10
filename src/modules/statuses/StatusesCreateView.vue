<script lang="ts" setup>
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import { StatusesServices } from './statuses.services';


const breadcrumbRoutes = [
    { label: 'Statuses', to: { name: 'statuses-default' } },
    { label: 'Create', to: { name: 'statuses-create' } },
];

const inputs: InputConfig[] = [
    { label: 'Status', inputId: 'status', inputType: 'input' },
]

const createEntity = async (data: { status: string }) => {
    await StatusesServices.createStatus(data.status)
}

</script>


<template>
    <GenericCreateForm :breadcrumb-routes="breadcrumbRoutes" view-title="Create status" :inputs="inputs"
        :create-entity="createEntity" />
</template>