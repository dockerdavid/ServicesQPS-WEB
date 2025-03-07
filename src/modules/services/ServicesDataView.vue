<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CleanersServices } from "./services.services";



const fetchServices = async (page: number, rows: number) => {
    return await CleanersServices.getServices(page, rows);
};

const deleteService = async (id: string) => {
    return await CleanersServices.deleteService(id);
};

const updateService = async (data: any) => {

};

const searchService = async (searchWord: any) => {
    return await CleanersServices.searchService(searchWord)
};

</script>

<template>
    <GenericDataView view-title="Services" create-new-route="/services/create" :headers="[
        { field: 'date', name: 'Date' },
        { field: 'schedule', name: 'Schedule' },
        { field: 'unitySize', name: 'Unit size' },
        { field: 'unitNumber', name: 'Unit number' },
        { field: 'community.communityName', name: 'Community' },
        { field: 'type.cleaningType', name: 'Type' },
        { field: 'status.statusName', name: 'Status' },
    ]" :editable-columns="['name', 'email']" :fetch-data="fetchServices" :delete-data="deleteService"
        :update-data="updateService" :search-data="searchService"/>
</template>