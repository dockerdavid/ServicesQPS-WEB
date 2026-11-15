<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { RecurringCostsServices } from "./recurring-costs.services";
import { formatCostCategory } from "../../constants/cost-categories";
import { IconField, InputIcon, InputText } from "primevue";
import ActiveStatusSelect from "../shared/components/ActiveStatusSelect.vue";
import { useStatusFilter } from "../shared/composables/useStatusFilter";

const { selectedStatus, statusParam } = useStatusFilter();

const fetchRecurringCosts = async (page: number, rows: number) => {
  return await RecurringCostsServices.getRecurringCosts(page, rows, statusParam());
};

const deleteRecurringCost = async (id: string) => {
  return await RecurringCostsServices.deleteRecurringCost(id);
};

const searchRecurringCost = async (searchWord: any, page: number, rows: number) => {
  return await RecurringCostsServices.searchRecurringCost(searchWord, page, rows, statusParam());
};

const formatActive = (value: boolean) => (value ? 'Yes' : 'No');
const formatDate = (value: string | null) => (value ? value : 'No end');
</script>

<template>
  <GenericDataView view-title="Recurring Costs" create-new-route="/recurring-costs/create" :headers="[
    { field: 'category', name: 'Category', format: formatCostCategory },
    { field: 'description', name: 'Description' },
    { field: 'amount', name: 'Amount' },
    { field: 'startDate', name: 'Start date' },
    { field: 'endDate', name: 'End date', format: formatDate },
    { field: 'isActive', name: 'Active', format: formatActive },
  ]" :fetch-data="fetchRecurringCosts" :delete-data="deleteRecurringCost" :search-data="searchRecurringCost"
    :reload-key="selectedStatus">
    <template #header-search="{ searchWord, clearSearch, setSearchWord }">
      <div class="flex flex-wrap items-center justify-end gap-3 w-full">
        <ActiveStatusSelect v-model="selectedStatus" />
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            :model-value="searchWord"
            @update:model-value="(v?: string) => setSearchWord(v ?? '')"
            placeholder="Search"
          />
          <InputIcon v-if="searchWord" class="pi pi-times cursor-pointer text-gray-500 hover:text-black"
            @click="clearSearch" />
        </IconField>
      </div>
    </template>
  </GenericDataView>
</template>
