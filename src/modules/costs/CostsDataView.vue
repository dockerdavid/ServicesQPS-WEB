<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CostsServices } from "./costs.services";



const fetchCosts = async (page: number, rows: number) => {
    return await CostsServices.getCosts(page, rows);
};

const deleteCost = async (id: string) => {
    return await CostsServices.deleteCost(id);
};

const updateCost = async (data: any) => {

};

const searchCost = async (searchWord: any) => {
    return await CostsServices.searchCost(searchWord)
};

</script>

<template>
    <GenericDataView view-title="Costs" create-new-route="/costs/create" :headers="[
        { field: 'date', name: 'Date' },
        { field: 'description', name: 'Description' },
    ]" :editable-columns="['name', 'email']" :fetch-data="fetchCosts" :delete-data="deleteCost"
        :update-data="updateCost" :search-data="searchCost" />
</template>