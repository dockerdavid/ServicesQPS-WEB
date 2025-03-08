<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { TypesServices } from "./types.services";



const fetchTypes = async (page: number, rows: number) => {
    return await TypesServices.getTypes(page, rows);
};

const deleteType = async (id: string) => {
    return await TypesServices.deleteType(id);
};

const updateType = async (data: any) => {

};

const searchType = async (searchWord: any, page: number, rows: number) => {
    return await TypesServices.searchType(searchWord, page, rows)
};

</script>

<template>
    <GenericDataView view-title="Types" create-new-route="/types/create" :headers="[
        { field: 'description', name: 'Description' },
        { field: 'cleaningType', name: 'Type' },
        { field: 'price', name: 'Price' },
        { field: 'community.communityName', name: 'Community' },
        { field: 'commission', name: 'Commission' },
    ]" :editable-columns="['name', 'email']" :fetch-data="fetchTypes" :delete-data="deleteType"
        :search-data="searchType" :update-data="updateType" />
</template>