<script setup lang="ts">
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import { RecurringCostsServices } from './recurring-costs.services';
import type { InputConfig } from '../../interfaces/input-config.interface';

const breadcrumbRoutes = [
  { label: 'Recurring Costs', to: { name: 'recurring-costs-default' } },
  { label: 'Edit', to: { name: 'recurring-costs-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Description', inputId: 'description', inputType: 'input' },
  { label: 'Amount', inputId: 'amount', inputType: 'numeric' },
  { label: 'Start date', inputId: 'startDate', inputType: 'datepicker', icon: 'calendar' },
  { label: 'End date', inputId: 'endDate', inputType: 'datepicker', icon: 'calendar', required: false },
  {
    label: 'Active',
    inputId: 'isActive',
    inputType: 'select',
    options: [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false },
    ],
  },
];

const loadData = async (id: string) => {
  const cost = await RecurringCostsServices.getRecurringCostById(id);
  return {
    ...cost,
    amount: cost.amount.toString(),
  };
};

const updateEntity = async (id: string, data: any) => {
  data.amount = data.amount.toString();
  await RecurringCostsServices.updateRecurringCost(id, data);
};
</script>

<template>
  <GenericEditForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Edit recurring cost"
    :inputs="inputs"
    :load-data="loadData"
    :update-entity="updateEntity"
    :initial-data="{ description: '', amount: '', startDate: '', endDate: '', isActive: true }"
  />
</template>
