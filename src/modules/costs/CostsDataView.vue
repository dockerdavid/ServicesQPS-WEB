<script setup lang="ts">
import { apiServicesQps } from "../../../src/api/api";
import LoadingButton from "../shared/components/LoadingButton.vue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CostsServices } from "./costs.services";
import { useGlobalStateStore } from "../../../src/store/auth.store";
import { computed, ref } from "vue";
import moment from 'moment-timezone';
import { Calendar, FloatLabel, InputGroup, InputGroupAddon, Select } from "primevue";
import { costCategoryOptions, formatCostCategory } from "../../constants/cost-categories";

const startDate = ref(new Date());
const endDate = ref(new Date());
const selectedCategory = ref<string | null>(null);

const formattedStartDate = computed(() =>
    startDate.value ? moment(startDate.value).format('YYYY-MM-DD') : ''
);

const formattedEndDate = computed(() =>
    endDate.value ? moment(endDate.value).format('YYYY-MM-DD') : ''
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
        const { data } = await apiServicesQps.get('/reports/costos-semana', {
            params: {
                startDate: formattedStartDate.value,
                endDate: formattedEndDate.value,
                category: selectedCategory.value || undefined,
            },
            responseType: 'blob'
        });


        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        const categorySuffix = selectedCategory.value ? `-${selectedCategory.value}` : '';
        link.setAttribute('download', `reporte-costos${categorySuffix}-${formattedStartDate.value}-${formattedEndDate.value}.pdf`);
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
        { field: 'category', name: 'Category', format: formatCostCategory },
        { field: 'description', name: 'Description' },
        { field: 'amount', name: 'Amount' },
    ]" :fetch-data="fetchCosts" :delete-data="deleteCost" :search-data="searchCost">

        <template #header-search>
            <div class=" w-full flex justify-between">
                <div class="flex items-center px-3 gap-4">
                    <div class="min-w-[12rem]">
                        <InputGroup>
                            <InputGroupAddon>
                                <i class="pi pi-calendar"></i>
                            </InputGroupAddon>
                            <FloatLabel variant="on">
                                <Calendar v-model="startDate" dateFormat="mm-dd-yy" />
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
                                <Calendar v-model="endDate" dateFormat="mm-dd-yy" />
                                <label>End date</label>
                            </FloatLabel>
                        </InputGroup>
                    </div>
                    <div class="min-w-[16rem]">
                        <Select
                            v-model="selectedCategory"
                            :options="costCategoryOptions"
                            optionLabel="label"
                            optionValue="value"
                            showClear
                            placeholder="All categories"
                            class="w-full"
                        />
                    </div>
                </div>

                <LoadingButton @click="getWeeklyCosts" label="Export costs" />
            </div>

        </template>


    </GenericDataView>
</template>
