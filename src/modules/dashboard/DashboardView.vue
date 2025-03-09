<script setup lang="ts">
import { h, ref } from "vue";
import { CleanersServices } from "../services/services.services";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { Button } from "primevue";


const fetchServices = async (page: number, rows: number) => {
    return await CleanersServices.getServices(page, rows);
};

const deleteService = async (id: string) => {
    return await CleanersServices.deleteService(id);
};


const searchService = async (searchWord: any, page: number, rows: number) => {
    return await CleanersServices.searchService(searchWord, page, rows)
};


</script>

<template>

    <GenericDataView :header-search="true" :dontShowBreadCrumb="true" :lock-create-new="true" :lockEdit="true"
        view-title="Dashboard" create-new-route="/services/create" :headers="[
            { field: 'date', name: 'Date' },
            { field: 'community.communityName', name: 'Community' },
            { field: 'type.cleaningType', name: 'Type' },
            { field: 'unitNumber', name: 'Unit number' },

            { field: 'type.price', name: 'Service price' },
            { field: 'type.commission', name: 'Commission' },
            { field: 'extras.price', name: 'Extras price' },
            { field: 'unitNumber', name: 'Extras commission' },

            { field: 'unitNumber', name: 'Total cleaner' },
            { field: 'unitNumber', name: 'Partner' },
            { field: 'unitNumber', name: 'Total' },

            { field: 'userId', name: 'Cleaner' },

            { field: 'status.statusName', name: 'Status' },

        ]" :fetch-data="fetchServices" :delete-data="deleteService" :search-data="searchService">

        <template #header-search>
            <div class="flex">
                <Button>Export general reports</Button>
                <div class="px-3"><Button>Export cleaner reports</Button></div>
                <Button>Invoices</Button>
            </div>
        </template>

    </GenericDataView>
</template>