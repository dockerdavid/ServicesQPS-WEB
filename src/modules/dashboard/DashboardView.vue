<script setup lang="ts">
import { computed, ref } from "vue";
import { CleanersServices } from "../services/services.services";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { Button, DatePicker, InputGroup, InputGroupAddon, FloatLabel } from "primevue";
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

const reportDate = ref(new Date());

const formattedDate = computed(() => 
  reportDate.value ? moment(reportDate.value).format('YYYY-MM-DD') : ''
);

const { setIsLoading } = useGlobalStateStore();

const getWeeklyReports = async () => {
    setIsLoading(true);
    try {
        const { data } = await apiServicesQps.get(`/reports/reporte-semana/${formattedDate.value}`, {
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
            <div class="flex justify-between py-2 overflow-x-auto w-full">

                <div class="flex items-center px-3 min-w-[12rem]">
                    <InputGroup>
                        <InputGroupAddon>
                            <i class="pi pi-calendar"></i>
                        </InputGroupAddon>
                        <FloatLabel variant="on">
                            <DatePicker v-model="reportDate" />
                            <label>Select date</label>
                        </FloatLabel>
                    </InputGroup>
                </div>

                <div class="flex">
                    <LoadingButton label="Export general reports" @click="getWeeklyReports" />
                    <div class="px-3">
                        <Button  class="h-full">Export cleaner reports</Button>
                    </div>
                    <Button>Invoices</Button>
                </div>
            </div>
        </template>

    </GenericDataView>

</template>

<style lang="scss" scoped>
.p-datepicker {
    max-height: 46px !important;
}
</style>