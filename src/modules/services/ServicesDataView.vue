<script setup lang="ts">
import type { Services } from "src/interfaces/services/services.interface";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CleanersServices } from "./services.services";
import { useUserStore } from "../../../src/store/user.store";



const fetchServices = async (page: number, rows: number) => {
    const store = useUserStore();

    let data: Services;

    switch (store.userData.roleId) {
        case "1":
            data = await CleanersServices.getServices(page, rows);
            break;
        case "3":
            data = await CleanersServices.getServicesByCommunities(page, rows);
            break;
        case "4":
            data = await CleanersServices.getServicesByCleaner(page, rows);
            break;

        default:
            data = await CleanersServices.getServices(page, rows);
            break;
    }
    return data
};

const deleteService = async (id: string) => {
    return await CleanersServices.deleteService(id);
};

const searchService = async (searchWord: any, page: number, rows: number) => {
    return await CleanersServices.searchService(searchWord, page, rows)
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
    ]" :fetch-data="fetchServices" :delete-data="deleteService" :search-data="searchService" />
</template>