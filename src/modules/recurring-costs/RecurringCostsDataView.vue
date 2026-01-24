<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { RecurringCostsServices } from "./recurring-costs.services";

const fetchRecurringCosts = async (page: number, rows: number) => {
  return await RecurringCostsServices.getRecurringCosts(page, rows);
};

const deleteRecurringCost = async (id: string) => {
  return await RecurringCostsServices.deleteRecurringCost(id);
};

const searchRecurringCost = async (searchWord: any, page: number, rows: number) => {
  return await RecurringCostsServices.searchRecurringCost(searchWord, page, rows);
};

const formatActive = (value: boolean) => (value ? 'Yes' : 'No');
const formatDate = (value: string | null) => (value ? value : 'No end');
</script>

<template>
  <GenericDataView view-title="Recurring Costs" create-new-route="/recurring-costs/create" :headers="[
    { field: 'description', name: 'Description' },
    { field: 'amount', name: 'Amount' },
    { field: 'startDate', name: 'Start date' },
    { field: 'endDate', name: 'End date', format: formatDate },
    { field: 'isActive', name: 'Active', format: formatActive },
  ]" :fetch-data="fetchRecurringCosts" :delete-data="deleteRecurringCost" :search-data="searchRecurringCost" />
</template>
