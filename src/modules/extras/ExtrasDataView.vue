<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Extra, Extras } from "@/interfaces/extras/extras.interface";
import { ExtrasServices } from "./extras.services";



const toast = useToast();

const extrasList = ref<Extras>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'item', name: 'Item' },
    { field: 'itemPrice', name: 'Item price' },
    { field: 'commission', name: 'Commission' },
]);

const editableColumns = ref(['item', 'itemPrice', 'commission']);

const onDelete = (item: Extra) => {
    extrasList.value.data = extrasList.value.data.filter((cost) => cost.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'item deleted',
        detail: `Item: ${item.item}`,
        severity: "info"
    })
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    extrasList.value = await ExtrasServices.getExtras();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Extras</template>
        <template #create-new>
            <router-link to="/extras/create">New extra</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="extrasList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>