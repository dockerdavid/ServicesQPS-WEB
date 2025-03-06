<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Extra, Extras } from "@/interfaces/extras/extras.interface";
import { ExtrasServices } from "./extras.services";
import genericNullObject from "@/utils/null-data-meta";
import { showToast } from "@/utils/show-toast";



const toast = useToast();

const extrasList = ref<Extras>(genericNullObject);

const headers = ref([
    { field: 'item', name: 'Item' },
    { field: 'itemPrice', name: 'Item price' },
    { field: 'commission', name: 'Commission' },
]);

const editableColumns = ref(['item', 'itemPrice', 'commission']);

const onDelete = async (item: Extra) => {
    const originalData = [...extrasList.value.data];
    extrasList.value.data = extrasList.value.data.filter((extra) => extra.id !== item.id);
    try {
        await ExtrasServices.deleteExtra(item.id)
        showToast(toast, {
            summary: 'Extra deleted',
            detail: `Extra: ${item.item}`,
            severity: "info"
        })
    } catch (error) {
        extrasList.value.data = originalData;
        showToast(toast, {
            summary: "Extra wasn't deleted",
            detail: `Extra: ${item.item}`,
            severity: "error"
        })
    }
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