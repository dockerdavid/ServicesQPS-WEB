<script setup lang="ts">
import { computed, ref } from "vue";
import moment from "moment";
import { Calendar, FloatLabel, IconField, InputGroup, InputGroupAddon, InputIcon, InputText } from "primevue";
import GenericDataView from "../shared/views/GenericDataView.vue";
import { CommunitiesServices } from "./communities.services";

const fetchCommunities = async (page: number, rows: number) => {
    return await CommunitiesServices.getCommunities(page, rows);
};

const deleteCommunity = async (id: string) => {
    return await CommunitiesServices.deleteCommunity(id);
};


const searchCommunity = async (searchWord: any, page: number, rows: number) => {
    return await CommunitiesServices.searchCommunity(searchWord, page, rows)
};

const startDate = ref(moment().startOf('year').toDate());
const endDate = ref(moment().endOf('year').toDate());

const formattedStartDate = computed(() =>
    startDate.value ? moment(startDate.value).format('MM-DD-YYYY') : ''
);

const formattedEndDate = computed(() =>
    endDate.value ? moment(endDate.value).format('MM-DD-YYYY') : ''
);

const headers = [
    { field: 'communityName', name: 'Community name', style: 'width: 25%' },
    { 
        field: 'managerUser', 
        name: 'Manager/Supervisor', 
        style: 'width: 25%',
        format: (value: any, row: any) => {
            const manager = row.managerUser;
            const supervisor = row.supervisorUser;
            
            return [
                manager ? `<div class="text-blue-600 mb-1">👨‍💼 Manager: ${manager.name}</div>` : '<div class="text-gray-400">👨‍💼 Sin manager</div>',
                supervisor ? `<div class="text-green-600">👨‍💼 Supervisor: ${supervisor.name}</div>` : '<div class="text-gray-400">👨‍💼 Sin supervisor</div>'
            ].join('');
        }
    },
    { field: 'company.companyName', name: 'Company', style: 'width: 25%' }
];

</script>

<template>
    <GenericDataView 
        view-title="Communities" 
        :headers="headers" 
        :fetch-data="fetchCommunities" 
        :delete-data="deleteCommunity"
        :search-data="searchCommunity"
        :show-export-button="true"
        :export-start-date="formattedStartDate"
        :export-end-date="formattedEndDate"
    >
        <template #header-search="{ searchWord, onSearch, clearSearch, setSearchWord }">
            <div class="flex flex-wrap items-center justify-between gap-3 w-full">
                <IconField>
                    <InputIcon class="pi pi-search" />
                    <InputText :modelValue="searchWord" @update:modelValue="setSearchWord" placeholder="Search" />
                    <InputIcon v-if="searchWord" class="pi pi-times cursor-pointer text-gray-500 hover:text-black"
                        @click="clearSearch" />
                </IconField>

                <div class="flex flex-wrap items-center gap-3">
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
                </div>
            </div>
        </template>
    </GenericDataView>
</template>

<style scoped>
:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 1rem;
}
</style>
