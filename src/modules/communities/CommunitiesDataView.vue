<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CommunitiesServices } from "./communities.services";

const fetchCommunities = async (page: number, rows: number) => {
    return await CommunitiesServices.getCommunities(page, rows);
};

const deleteCommunity = async (id: string) => {
    return await CommunitiesServices.deleteCommunity(id);
};


const searchCommunity = async (searchWord: any, page: number, rows: number) => {
    return await CommunitiesServices.searchCommunity(searchWord, page, rows)
};

const headers = [
    { field: 'communityName', name: 'Community name', style: 'width: 25%' },
    { 
        field: 'managerUser', 
        name: 'Manager/Supervisor', 
        style: 'width: 25%',
        format: (value: any, row: any) => {
            const manager = row.managerUser;
            const supervisor = row.supervisorUser;
            
            return [
                manager ? `<div class="text-blue-600 mb-1">👨‍💼 Manager: ${manager.name}</div>` : '<div class="text-gray-400">👨‍💼 Sin manager</div>',
                supervisor ? `<div class="text-green-600">👨‍💼 Supervisor: ${supervisor.name}</div>` : '<div class="text-gray-400">👨‍💼 Sin supervisor</div>'
            ].join('');
        }
    },
    { field: 'company.companyName', name: 'Company', style: 'width: 25%' }
];

</script>

<template>
    <GenericDataView 
        view-title="Communities" 
        :headers="headers" 
        :fetch-data="fetchCommunities" 
        :delete-data="deleteCommunity"
        :search-data="searchCommunity" 
    />
</template>

<style scoped>
:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 1rem;
}
</style>