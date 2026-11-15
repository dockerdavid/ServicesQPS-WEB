<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { RecurringServicesServices } from "./recurring-services.services";
import { IconField, InputIcon, InputText } from "primevue";
import ActiveStatusSelect from "../shared/components/ActiveStatusSelect.vue";
import { useStatusFilter } from "../shared/composables/useStatusFilter";

const { selectedStatus, statusParam } = useStatusFilter();

const fetchRecurringServices = async (page: number, rows: number) => {
  return await RecurringServicesServices.getRecurringServices(page, rows, statusParam());
};

const deleteRecurringService = async (id: string) => {
  return await RecurringServicesServices.deleteRecurringService(id);
};

const searchRecurringService = async (searchWord: any, page: number, rows: number) => {
  return await RecurringServicesServices.searchRecurringService(searchWord, page, rows, statusParam());
};

const formatActive = (value: boolean | number) => (value ? 'Yes' : 'No');
const formatQaHiddenDays = (value: string[] | string | null | undefined) => {
  if (!value) return 'None (all visible)';
  const daysArray = Array.isArray(value) ? value : value.split(',');
  if (daysArray.length === 0) return 'None (all visible)';
  const map: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  };
  return daysArray.map(day => map[day] || day).join(', ');
};
const formatDays = (value: string[] | string | null | undefined) => {
  if (!value) return 'N/A';
  const daysArray = Array.isArray(value) ? value : value.split(',');
  if (daysArray.length === 0) return 'N/A';
  const map: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  };
  return daysArray.map(day => map[day] || day).join(', ');
};
</script>

<template>
  <GenericDataView
    view-title="Recurring Services"
    create-new-route="/recurring-services/create"
    :headers="[
      { field: 'community.communityName', name: 'Community' },
      { field: 'type.cleaningType', name: 'Type' },
      { field: 'user.name', name: 'Assigned' },
      { field: 'unitNumber', name: 'Unit number' },
      { field: 'unitySize', name: 'Unit size' },
      { field: 'schedule', name: 'Schedule' },
      { field: 'daysOfWeek', name: 'Days', format: formatDays },
      { field: 'status.statusName', name: 'Status' },
      { field: 'startDate', name: 'Start date' },
      { field: 'isActive', name: 'Active', format: formatActive },
      { field: 'qaHiddenDays', name: 'Hidden from reports', format: formatQaHiddenDays },
    ]"
    :fetch-data="fetchRecurringServices"
    :delete-data="deleteRecurringService"
    :search-data="searchRecurringService"
    :reload-key="selectedStatus"
  >
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
