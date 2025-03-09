<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CostsServices } from "./costs.services";



const fetchCosts = async (page: number, rows: number) => {
    return await CostsServices.getCosts(page, rows);
};

const deleteCost = async (id: string) => {
    return await CostsServices.deleteCost(id);
};


const searchCost = async (searchWord: any, page: number, rows: number) => {
    return await CostsServices.searchCost(searchWord, page, rows)
};

</script>

<template>
    <GenericDataView view-title="Costs" create-new-route="/costs/create" :headers="[
        { field: 'date', name: 'Date' },
        { field: 'description', name: 'Description' },
    ]"  :fetch-data="fetchCosts" :delete-data="deleteCost"
         :search-data="searchCost" />
</template>