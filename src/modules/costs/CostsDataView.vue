<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";

import type { Cost, Costs } from "@/interfaces/costs/costs.interface";
import { CostsServices } from "./costs.services";
import { showToast } from "@/utils/show-toast";
import genericNullObject from "@/utils/null-data-meta";


const toast = useToast();

const costsList = ref<Costs>(genericNullObject);

const headers = ref([
    { field: 'date', name: 'Date' },
    { field: 'description', name: 'Description' },
]);

const editableColumns = ref(['date', 'description']);

const onDelete = async (item: Cost) => {
    const originalData = [...costsList.value.data];
    costsList.value.data = costsList.value.data.filter((cost) => cost.id !== item.id);
    try {
        await CostsServices.deleteCost(item.id)
        showToast(toast, {
            summary: 'Extra deleted',
            detail: `Extra: ${item.description}`,
            severity: "info"
        })
    } catch (error) {
        costsList.value.data = originalData;
        showToast(toast, {
            summary: "Extra wasn't deleted",
            detail: `Extra: ${item.description}`,
            severity: "error"
        })
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    costsList.value = await CostsServices.getCosts();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Costs</template>
        <template #create-new>
            <router-link to="/costs/create">New cost</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="costsList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>