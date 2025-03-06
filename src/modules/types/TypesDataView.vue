<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Type, Types } from "@/interfaces/types/types.interface";
import { TypesServices } from "./types.services";
import { showToast } from "@/utils/show-toast";


const toast = useToast();

const typesList = ref<Types>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'description', name: 'Description' },
    { field: 'cleaningType', name: 'Type' },
    { field: 'price', name: 'Price' },
    { field: 'community.communityName', name: 'Community' },
    { field: 'commission', name: 'Commission' },
]);

const editableColumns = ref(['companyName']);

const onDelete = async (item: Type) => {
    const originalData = [...typesList.value.data];
    typesList.value.data = typesList.value.data.filter((type) => type.id !== item.id);
    try {
        await TypesServices.deleteType(item.id)
        showToast(toast, {
            summary: 'Type deleted',
            detail: `Type: ${item.cleaningType}`,
            severity: "info"
        })
    } catch (error) {
        typesList.value.data = originalData;
        showToast(toast, {
            summary: "Type wasn't deleted",
            detail: `Type: ${item.cleaningType}`,
            severity: "error"
        })
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    typesList.value = await TypesServices.getTypes();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Types</template>
        <template #create-new>
            <router-link to="/types/create">New type</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="typesList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>