<script setup lang="ts">
import { ref } from 'vue';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import { CostsServices } from './costs.services';
import { useToast } from 'primevue';
import { showToast } from '@/utils/show-toast';
import { useRoute } from 'vue-router';
import type { InputConfig } from '@/interfaces/input-config.interface';

const toast = useToast();
const route = useRoute();
const costId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Costs', to: { name: 'costs-default' } },
  { label: 'Edit', to: { name: 'costs-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Date', inputId: 'date', inputType: 'datepicker', icon: 'calendar' },
  { label: 'Description', inputId: 'description', inputType: 'input' },
  { label: 'Amount', inputId: 'amount', inputType: 'numeric' },
];

const loadData = async (id: string) => {
  const cost = await CostsServices.getCostById(id);
  return {
    ...cost,
    amount: cost.amount.toString(),
  };
};

const updateEntity = async (id: string, data: any) => {
  data.amount = data.amount.toString();
  await CostsServices.updateCost(id, data);

};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit Cost" :inputs="inputs" :load-data="loadData"
    :update-entity="updateEntity" :initial-data="{ date: '', description: '', amount: '' }" />
</template>