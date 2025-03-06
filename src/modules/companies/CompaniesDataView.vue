<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";

import { CompaniesServices } from "./companies.services";
import type { Company, Companies } from "@/interfaces/companies/companies.interface";

const toast = useToast();

const companiesList = ref<Companies>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'companyName', name: 'Company name' },
]);

const editableColumns = ref(['companyName']);

const onDelete = (item: Company) => {
    companiesList.value.data = companiesList.value.data.filter((company) => company.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'Company deleted',
        detail: `Company name: ${item.companyName}`,
        severity: "info"
    })
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    companiesList.value = await CompaniesServices.getCompanies();
})

</script>

<template>
    <BaseLayout>
        <template #view-title>Companies</template>
        <template #create-new>
            <router-link to="/companies/create">New company</router-link>
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