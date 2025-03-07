<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CommunitiesServices } from "./communities.services";

const fetchCommunities = async (page: number, rows: number) => {
    return await CommunitiesServices.getCommunities(page, rows);
};

const deleteCommunity = async (id: string) => {
    return await CommunitiesServices.deleteCommunity(id);
};

const updateCommunity = async (data: any) => {

};

const searchCommunity = async (searchWord: any) => {
    return await CommunitiesServices.searchCommunity(searchWord)
};

</script>

<template>
    <GenericDataView view-title="Communities" create-new-route="/communities/create" :headers="[
        { field: 'communityName', name: 'Community name', style: 'width: 25%' },
        { field: 'user.name', name: 'Manager', style: 'width: 25%' },
        { field: 'company.companyName', name: 'Company', style: 'width: 25%' }
    ]" :editable-columns="['name', 'email']" :fetch-data="fetchCommunities" :delete-data="deleteCommunity"
        :update-data="updateCommunity"  :search-data="searchCommunity"/>
</template>