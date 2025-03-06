<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Statuses } from "@/interfaces/statuses/statuses.interface";
import type { Status } from "@/interfaces/services/services.interface";
import { StatusesServices } from "./statuses.services";
import { showToast } from "@/utils/show-toast";

const toast = useToast();

const statusesList = ref<Statuses>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});
const currentPage = ref(1); 
const rowsPerPage = ref(10); 

const headers = ref([
    { field: 'statusName', name: 'Status name' },
]);

const fetchStatuses = async() =>{
    statusesList.value = await StatusesServices.getStatuses(currentPage.value, rowsPerPage.value);
}

const editableColumns = ref(['companyName']);

const onDelete = async (item: Status) => {
    const originalData = [...statusesList.value.data];
    statusesList.value.data = statusesList.value.data.filter((status) => status.id !== item.id);
    try {
        await StatusesServices.deleteStatus(item.id)
        showToast(toast, {
            summary: 'Status deleted',
            detail: `Status: ${item.statusName}`,
            severity: "info"
        })
    } catch (error) {
        statusesList.value.data = originalData;
        showToast(toast, {
            summary: "Status wasn't deleted",
            detail: `Status: ${item.statusName}`,
            severity: "error"
        })
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

const handlePageChange = (event: any) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    fetchStatuses(); 
};

onMounted(async () => {
    fetchStatuses()
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Statuses</template>
        <template #create-new>
            <router-link to="/statuses/create">New status</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="statusesList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" @page-change="handlePageChange"
                :total-records="statusesList.meta.totalCount" />
        </template>
    </BaseLayout>
</template>
