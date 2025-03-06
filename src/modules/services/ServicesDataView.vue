<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Extra, Extras } from "@/interfaces/extras/extras.interface";
import { CleanersServices } from "./services.services";
import type { Service, Services } from "@/interfaces/services/services.interface";
import { showToast } from "@/utils/show-toast";



const toast = useToast();

const servicesList = ref<Services>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'date', name: 'Date' },
    { field: 'schedule', name: 'Schedule' },
    { field: 'unitySize', name: 'Unit size' },
    { field: 'unitNumber', name: 'Unit number' },
    { field: 'community.communityName', name: 'Community' },
    { field: 'type.cleaningType', name: 'Type' },
    { field: 'status.statusName', name: 'Status' },
]);

const editableColumns = ref(['item', 'itemPrice', 'commission']);

const onDelete = async (item: Service) => {
    const originalData = [...servicesList.value.data];
    servicesList.value.data = servicesList.value.data.filter((community) => community.id !== item.id);
    try {
        await CleanersServices.deleteService(item.id)
        showToast(toast, {
            summary: 'Service deleted',
            detail: `Service: ${item.id}`,
            severity: "info"
        })
    } catch (error) {
        servicesList.value.data = originalData;
        showToast(toast, {
            summary: "Service wasn't deleted",
            detail: `Service: ${item.id}`,
            severity: "error"
        })
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    servicesList.value = await CleanersServices.getServices();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Services</template>
        <template #create-new>
            <router-link to="/services/create">New service</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="servicesList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>