<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { RecurringServicesServices } from "./recurring-services.services";

const fetchRecurringServices = async (page: number, rows: number) => {
  return await RecurringServicesServices.getRecurringServices(page, rows);
};

const deleteRecurringService = async (id: string) => {
  return await RecurringServicesServices.deleteRecurringService(id);
};

const searchRecurringService = async (searchWord: any, page: number, rows: number) => {
  return await RecurringServicesServices.searchRecurringService(searchWord, page, rows);
};

const formatActive = (value: boolean | number) => (value ? 'Yes' : 'No');
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
    ]"
    :fetch-data="fetchRecurringServices"
    :delete-data="deleteRecurringService"
    :search-data="searchRecurringService"
  />
</template>
