<template>
    <BaseLayout>
        <template #view-title>Communities</template>
        <template #create-new>
            <router-link to="/communities/create">New community</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable 
                :data="communitiesList.data" 
                :headers="headers" 
                :editableColumns="editableColumns"
                :onDelete="onDelete" 
                @update="handleUpdate" 
                @page-change="handlePageChange"
                :totalRecords="communitiesList.meta.totalCount"
            />
        </template>
    </BaseLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import { CommunitiesServices } from "./communities.services";
import { showToast } from "@/utils/show-toast";
import genericNullObject from "@/utils/null-data-meta";

const toast = useToast();

const communitiesList = ref<Communities>(genericNullObject);
const currentPage = ref(1);
const rowsPerPage = ref(10);

const headers = ref([
    { field: 'communityName', name: 'Community name', style: 'width: 25%' },
    { field: 'user.name', name: 'Manager', style: 'width: 25%' },
    { field: 'company.companyName', name: 'Company', style: 'width: 25%' }
]);

const fetchCommunities = async () => {
    communitiesList.value = await CommunitiesServices.getCommunities(currentPage.value, rowsPerPage.value);
};

const editableColumns = ref(['communityName', 'user.name', 'company.companyName']);

const onDelete = async (item: Community) => {
    const originalData = [...communitiesList.value.data];
    communitiesList.value.data = communitiesList.value.data.filter((community) => community.id !== item.id);
    try {
        await CommunitiesServices.deleteCommunity(item.id);
        showToast(toast, {
            summary: 'Community deleted',
            detail: `Community: ${item.communityName}`,
            severity: "info"
        });
    } catch (error) {
        communitiesList.value.data = originalData;
        showToast(toast, {
            summary: "Community wasn't deleted",
            detail: `Community: ${item.communityName}`,
            severity: "error"
        });
    }
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

const handlePageChange = (event: any) => {
    currentPage.value = event.page + 1; 
    rowsPerPage.value = event.rows;
    fetchCommunities();
};

onMounted(async () => {
    await fetchCommunities();
});
</script>

<style scoped></style>