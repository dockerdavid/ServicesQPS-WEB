<script setup lang="ts">

import GenericDataView from "../shared/views/GenericDataView.vue";
import { StatusesServices } from "./statuses.services";

const fetchStatuses = async (page: number, rows: number) => {
    return await StatusesServices.getStatuses(page, rows);
};

const deleteStatus = async (id: string) => {
    return await StatusesServices.deleteStatus(id);
};

const updateStatus = async (data: any) => {

};

</script>

<template>
    <GenericDataView
        view-title="Statuses"
        create-new-route="/statuses/create"
        :headers="[
            { field: 'statusName', name: 'Status name' }
        ]"
        :editable-columns="['statusName']"
        :fetch-data="fetchStatuses"
        :delete-data="deleteStatus"
        :update-data="updateStatus"
    />
</template>