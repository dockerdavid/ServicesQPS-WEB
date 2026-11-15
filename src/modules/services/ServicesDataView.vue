<script setup lang="ts">
import type { Services } from "src/interfaces/services/services.interface";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CleanersServices } from "./services.services";
import { useUserStore } from "../../../src/store/user.store";
import { computed } from "vue";


const fetchServices = async (page: number, rows: number) => {
    const store = useUserStore();

    let data: Services;

    switch (store.userData?.roleId) {
        case "1":
        case "9":
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

const userStore = useUserStore();

const headers = computed(() => {
    const roleId = userStore?.userData?.roleId
    if (roleId === "4") return headersCleaner
    // Precio negociado: admin (1/9) y manager (3). El supervisor (6) no lo ve.
    if (roleId === "1" || roleId === "9" || roleId === "3") return headersWithPrice
    return headersSuperAdmin
})

const headersSuperAdmin = [
    { field: 'date', name: 'Date' },
    { field: 'schedule', name: 'Schedule' },
    { field: 'unitySize', name: 'Unit size' },
    { field: 'unitNumber', name: 'Unit number' },
    { field: 'community.communityName', name: 'Community' },
    { field: 'type.cleaningType', name: 'Type' },
    { field: 'status.statusName', name: 'Status' },
    { field: 'comment', name: 'Comment' },
    { field: 'extras', name: 'Extras' },
    { field: 'user.name', name: 'Cleaner' },
]


const headersWithPrice = [
    ...headersSuperAdmin.slice(0, 6),
    { field: 'type.price', name: 'Price' },
    ...headersSuperAdmin.slice(6),
]

const headersCleaner = [
    { field: 'date', name: 'Date' },
    { field: 'schedule', name: 'Schedule' },
    { field: 'unitySize', name: 'Unit size' },
    { field: 'unitNumber', name: 'Unit number' },
    { field: 'community.communityName', name: 'Community' },
    { field: 'type.cleaningType', name: 'Type' },
    { field: 'status.statusName', name: 'Status' },
    { field: 'comment', name: 'Comment' },
    { field: 'type.commission', name: 'Commission' },
    { field: 'extras', name: 'Extras' },
]

</script>

<template>
    <GenericDataView :use-services-table="true" view-title="Services" create-new-route="/services/create"
        :headers="headers" :fetch-data="fetchServices" :delete-data="deleteService"
        :search-data="searchService" />
</template>
