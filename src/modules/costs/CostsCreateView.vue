<script setup lang="ts">

import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import { CostsServices } from './costs.services';
import type { NewCost } from 'src/interfaces/costs/costs.interface';
import { costCategoryOptions, DEFAULT_COST_CATEGORY } from '../../constants/cost-categories';


const breadcrumbRoutes = [
  { label: 'Costs', to: { name: 'costs-default' } },
  { label: 'Create', to: { name: 'costs-create' } },
];


const inputs:InputConfig[] = [
  { inputId: 'date', label: 'Date', inputType: 'datepicker' },
  { inputId: 'category', label: 'Category', inputType: 'select', defaultValue: DEFAULT_COST_CATEGORY },
  { inputId: 'description', label: 'Description', inputType: 'input' },
  { inputId: 'amount', label: 'Amount', inputType: 'numeric'},
];


const loadOptions = async () => ({ category: costCategoryOptions });

const createEntity = async (data: NewCost) => {
data.amount = data.amount.toString();
  await CostsServices.createCost(data);
};
</script>

<template>
  <GenericCreateForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Create cost"
    :inputs="inputs"
    :create-entity="createEntity"
    :load-options="loadOptions"
 
  />
</template>