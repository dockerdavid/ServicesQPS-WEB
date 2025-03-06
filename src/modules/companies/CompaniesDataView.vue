<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";

import { CompaniesServices } from "./companies.services";
import type { Company, Companies } from "@/interfaces/companies/companies.interface";
import genericNullObject from "@/utils/null-data-meta";
import { showToast } from "@/utils/show-toast";

const toast = useToast();

const companiesList = ref<Companies>(
    genericNullObject
);
const currentPage = ref(1); 
const rowsPerPage = ref(10); 

const headers = ref([
    { field: 'companyName', name: 'Company name' },
]);

const editableColumns = ref(['companyName']);

const handlePageChange = (event: any) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    fetchCompanies(); 
};

const fetchCompanies = async () => {
    companiesList.value = await CompaniesServices.getCompanies(currentPage.value, rowsPerPage.value);
}

const onDelete = async (item: Company) => {
    const originalData = [...companiesList.value.data];
    companiesList.value.data = companiesList.value.data.filter((company) => company.id !== item.id);
    try {
        await CompaniesServices.deleteCompany(item.id)
        showToast(toast, {
            summary: 'Company deleted',
            detail: `Company: ${item.companyName}`,
            severity: "info"
        })
    } catch (error) {
        companiesList.value.data = originalData;
        showToast(toast, {
            summary: "Company wasn't deleted",
            detail: `Company: ${item.companyName}`,
            severity: "error"
        })
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
    fetchCompanies();
};


onMounted(async () => {
    await fetchCompanies();
});

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
            <EditableDataTable
                :data="companiesList.data"
                :headers="headers"
                :editableColumns="editableColumns"
                :onDelete="onDelete"
                @update="handleUpdate"
                @page-change="handlePageChange"
                :total-records="companiesList.meta.totalCount"
            />
        </template>
    </BaseLayout>
</template>

