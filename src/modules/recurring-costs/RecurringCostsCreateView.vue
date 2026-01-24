<script setup lang="ts">
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import { RecurringCostsServices } from './recurring-costs.services';
import type { NewRecurringCost } from 'src/interfaces/recurring-costs/recurring-costs.interface';

const breadcrumbRoutes = [
  { label: 'Recurring Costs', to: { name: 'recurring-costs-default' } },
  { label: 'Create', to: { name: 'recurring-costs-create' } },
];

const inputs: InputConfig[] = [
  { inputId: 'description', label: 'Description', inputType: 'input' },
  { inputId: 'amount', label: 'Amount', inputType: 'numeric' },
  { inputId: 'startDate', label: 'Start date', inputType: 'datepicker' },
  { inputId: 'endDate', label: 'End date', inputType: 'datepicker' },
  { inputId: 'isActive', label: 'Active', inputType: 'select' },
];

const loadOptions = async () => {
  return {
    isActive: [
      { label: 'Active', value: true },
      { label: 'Inactive', value: false },
    ],
  };
};

const createEntity = async (data: NewRecurringCost) => {
  data.amount = data.amount.toString();
  await RecurringCostsServices.createRecurringCost(data);
};
</script>

<template>
  <GenericCreateForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Create recurring cost"
    :inputs="inputs"
    :create-entity="createEntity"
    :load-options="loadOptions"
  />
</template>
