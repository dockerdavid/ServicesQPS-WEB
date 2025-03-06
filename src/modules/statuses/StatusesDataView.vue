<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Statuses } from "@/interfaces/statuses/statuses.interface";
import type { Status } from "@/interfaces/services/services.interface";
import { StatusesServices } from "./statuses.services";

const toast = useToast();

const companiesList = ref<Statuses>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'statusName', name: 'Status name' },
]);

const editableColumns = ref(['companyName']);

const onDelete = (item: Status) => {
    companiesList.value.data = companiesList.value.data.filter((company) => company.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'Status deleted',
        detail: `Status: ${item.statusName}`,
        severity: "info"
    })
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    companiesList.value = await StatusesServices.getStatuses();
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
            <EditableDataTable :data="companiesList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>