<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { ExtrasServices } from "./extras.services";



const fetchExtras = async (page: number, rows: number) => {
    return await ExtrasServices.getExtras(page, rows);
};

const deleteExtra = async (id: string) => {
    return await ExtrasServices.deleteExtra(id);
};


const searchExtra = async (searchWord: any, page: number, rows: number) => {
    return await ExtrasServices.searchExtra(searchWord, page, rows)
};

</script>

<template>
    <GenericDataView view-title="Extras" create-new-route="/extras/create" :headers="[
        { field: 'item', name: 'Item' },
        { field: 'itemPrice', name: 'Item price' },
        { field: 'commission', name: 'Commission' },
    ]"  :fetch-data="fetchExtras" :delete-data="deleteExtra"
         :search-data="searchExtra" />
</template>