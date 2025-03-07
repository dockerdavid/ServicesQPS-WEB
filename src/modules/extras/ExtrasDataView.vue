<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { ExtrasServices } from "./extras.services";



const fetchExtras = async (page: number, rows: number) => {
    return await ExtrasServices.getExtras(page, rows);
};

const deleteExtra = async (id: string) => {
    return await ExtrasServices.deleteExtra(id);
};

const updateUser = async (data: any) => {

};

const searchExtra = async (searchWord: any) => {
    return await ExtrasServices.searchExtra(searchWord)
};

</script>

<template>
    <GenericDataView view-title="Extras" create-new-route="/extras/create" :headers="[
        { field: 'item', name: 'Item' },
        { field: 'itemPrice', name: 'Item price' },
        { field: 'commission', name: 'Commission' },
    ]" :editable-columns="['name', 'email']" :fetch-data="fetchExtras" :delete-data="deleteExtra"
        :update-data="updateUser" :search-data="searchExtra" />
</template>