<script setup lang="ts">
import { apiServicesQps } from "../../../src/api/api";
import LoadingButton from "../shared/components/LoadingButton.vue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CostsServices } from "./costs.services";
import { useGlobalStateStore } from "../../../src/store/auth.store";
import { computed, ref } from "vue";
import moment from "moment";


const reportDate = ref(new Date());

const formattedDate = computed(() => 
  reportDate.value ? moment(reportDate.value).format('YYYY-MM-DD') : ''
);

const { setIsLoading } = useGlobalStateStore();

const fetchCosts = async (page: number, rows: number) => {
    return await CostsServices.getCosts(page, rows);
};

const deleteCost = async (id: string) => {
    return await CostsServices.deleteCost(id);
};


const searchCost = async (searchWord: any, page: number, rows: number) => {
    return await CostsServices.searchCost(searchWord, page, rows)
};

const getWeeklyCosts = async () => {
    setIsLoading(true);
    try {
        const { data } = await apiServicesQps.get(`/reports/costos-semana/${formattedDate.value}`, {
            responseType: 'blob'
        });


        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-semana-${formattedDate.value}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error al obtener el reporte:", error);
    } finally {
        setIsLoading(false);
    }
};

</script>

<template>
    <GenericDataView view-title="Costs" create-new-route="/costs/create" :headers="[
        { field: 'date', name: 'Date' },
        { field: 'description', name: 'Description' },
        { field: 'amount', name: 'Amount' },
    ]" :fetch-data="fetchCosts" :delete-data="deleteCost" :search-data="searchCost">

        <template #header-button>
            <LoadingButton @click="getWeeklyCosts" label="Export costs"/>
        </template>

    </GenericDataView>
</template>