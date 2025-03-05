<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';

import BaseLayout from '@/layouts/BaseLayout.vue';
import EditableDataTable from "../shared/components/EditableDataTable.vue";

import type { Communities, Community } from "@/interfaces/communities/communities.interface";

import { CommunitiesServices } from "./communities.services";

const toast = useToast();

const communitiesList = ref<Communities>({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});

const headers = ref([
    { field: 'communityName', name: 'Community name', style: 'width: 25%' },
    { field: 'user.name', name: 'Manager', style: 'width: 25%' },
    { field: 'company.companyName', name: 'Company', style: 'width: 25%' }
]);

const editableColumns = ref(['communityName', 'user.name', 'company.companyName']);

const onDelete = (item: Community) => {
    communitiesList.value.data = communitiesList.value.data.filter((community) => community.id !== item.id);
    toast.add({
        closable: true,
        life: 5000,
        summary: 'Community deleted',
        detail: `Community name: ${item.communityName}`,
        severity: "info"
    })
};

const handleUpdate = (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;
    data[field] = newValue;
};

onMounted(async () => {
    communitiesList.value = await CommunitiesServices.getCommunities();
})

</script>

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
            <EditableDataTable :data="communitiesList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" />
        </template>
    </BaseLayout>
</template>

<style scoped></style>