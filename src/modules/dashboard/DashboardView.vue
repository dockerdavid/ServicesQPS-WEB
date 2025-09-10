<script setup lang="ts">
import { computed, ref } from "vue";
import { CleanersServices } from "../services/services.services";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { Button, Calendar, InputGroup, InputGroupAddon, FloatLabel } from "primevue";
import { apiServicesQps } from "../../../src/api/api";
import { useGlobalStateStore } from "../../../src/store/auth.store";
import LoadingButton from "../shared/components/LoadingButton.vue";
import moment from "moment";


const fetchServices = async (page: number, rows: number) => {
    return await CleanersServices.getServices(page, rows);
};

const deleteService = async (id: string) => {
    return await CleanersServices.deleteService(id);
};


const searchService = async (searchWord: any, page: number, rows: number) => {
    return await CleanersServices.searchService(searchWord, page, rows)
};

const startDate = ref(new Date());
const endDate = ref(new Date());

const formattedStartDate = computed(() =>
    startDate.value ? moment(startDate.value).format('YYYY-MM-DD') : ''
);

const formattedEndDate = computed(() =>
    endDate.value ? moment(endDate.value).format('YYYY-MM-DD') : ''
);

const { setIsLoading } = useGlobalStateStore();

const getWeeklyReports = async () => {
    setIsLoading(true);
    try {
        const { data } = await apiServicesQps.get(`/reports/reporte-semana?startDate=${formattedStartDate.value}&endDate=${formattedEndDate.value}`, {
            responseType: 'blob'
        });


        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-semana-${formattedStartDate.value}-${formattedEndDate.value}.pdf`);
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

const getGeneralReport = async () => {
    setIsLoading(true);
    try {
        const { data } = await apiServicesQps.get(`/reports/reporte-general?startDate=${formattedStartDate.value}&endDate=${formattedEndDate.value}`, {
            responseType: 'blob'
        });


        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-general-${formattedStartDate.value}-${formattedEndDate.value}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error al obtener el reporte:", error);
    } finally {
        setIsLoading(false);
    }
}

const getCleanerReport = async () => {
    setIsLoading(true);
    try {
        const { data } = await apiServicesQps.get(`/reports/reporte-cleaner?startDate=${formattedStartDate.value}&endDate=${formattedEndDate.value}`, {
            responseType: 'blob'
        });


        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte-cleaner-${formattedStartDate.value}-${formattedEndDate.value}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error al obtener el reporte:", error);
    } finally {
        setIsLoading(false);
    }
}



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
            { field: 'extrasPrice', name: 'Extras price' },
            { field: 'extrasCommission', name: 'Extras commission' },

            { field: 'totalCleaner', name: 'Total cleaner' },
            { field: 'totalParner', name: 'Partner' },
            { field: 'total', name: 'Total' },

            { field: 'user.name', name: 'Cleaner' },

            { field: 'status.statusName', name: 'Status' },

        ]" :fetch-data="fetchServices" :delete-data="deleteService" :search-data="searchService">

        <template #header-search>
            <div class="flex justify-between py-2 overflow-x-auto w-full">

                <div class="flex items-center px-3 gap-4">
                    <div class="min-w-[12rem]">
                        <InputGroup>
                            <InputGroupAddon>
                                <i class="pi pi-calendar"></i>
                            </InputGroupAddon>
                            <FloatLabel variant="on">
                                <Calendar v-model="startDate" dateFormat="yy-mm-dd" />
                                <label>Start date</label>
                            </FloatLabel>
                        </InputGroup>
                    </div>
                    <div class="min-w-[12rem]">
                        <InputGroup>
                            <InputGroupAddon>
                                <i class="pi pi-calendar"></i>
                            </InputGroupAddon>
                            <FloatLabel variant="on">
                                <Calendar v-model="endDate" dateFormat="yy-mm-dd" />
                                <label>End date</label>
                            </FloatLabel>
                        </InputGroup>
                    </div>
                </div>

                <div class="flex">
                    <LoadingButton label="Export general reports" @click="getGeneralReport" />
                    <div class="px-3"></div>
                    <LoadingButton label="Export cleaner reports" @click="getCleanerReport" />
                </div>
            </div>
        </template>

    </GenericDataView>

</template>

<style lang="scss" scoped>
.p-calendar {
    max-height: 46px !important;
}
</style>