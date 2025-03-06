<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";

import type { Cost, Costs } from "@/interfaces/costs/costs.interface";
import { CostsServices } from "./costs.services";


const toast = useToast();

const costsList = ref<Costs>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'date', name: 'Date' },
    { field: 'description', name: 'Description' },
]);

const editableColumns = ref(['date', 'description']);

const onDelete = (item: Cost) => {
    costsList.value.data = costsList.value.data.filter((cost) => cost.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'Costs deleted',
        detail: `Cost description: ${item.description}`,
        severity: "info"
    })
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