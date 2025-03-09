<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import { StatusesServices } from './statuses.services';
import { showToast } from '@/utils/show-toast';
import type { InputConfig } from '@/interfaces/input-config.interface';

const route = useRoute();
const toast = useToast();
const statusId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Statuses', to: { name: 'statuses-default' } },
  { label: 'Edit', to: { name: 'statuses-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Status name', inputId: 'statusName', inputType: 'input' },
];

const loadData = async (id: string) => {
  return await StatusesServices.getStatusById(id);
};

const updateEntity = async (id: string, data: any) => {
  await StatusesServices.updateStatus(id, data);
};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit Status" :inputs="inputs" :load-data="loadData"
    :update-entity="updateEntity" :initial-data="{ statusName: '' }" />
</template>