<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';
import BaseLayout from '../../../layouts/BaseLayout.vue';
import { showToast } from "../../../utils/show-toast";
import DataTable from "../components/DataTable.vue";
import DataTableServices from "../../../../src/modules/services/components/DataTableServices.vue";

interface Header {
    field: string;
    name: string;
    style?: string;
    format?: (value: any, row?: any) => string;
    slotName?: string;
}

interface Props {
    viewTitle: string;
    headers: Header[];
    fetchData: (page: number, rows: number) => Promise<any>;
    deleteData: (id: string) => Promise<void>;
    searchData: (data: string, page: number, rows: number) => Promise<any>;
    lockEdit?: boolean;
    lockCreateNew?: boolean;
    dontShowBreadCrumb?: boolean;
    useServicesTable?: boolean;
    showExportButton?: boolean;
    exportStartDate?: string;
    exportEndDate?: string;
    createNewRoute?: string;
    editRoute?: string;
    routeBase?: string;
}

const props = defineProps<Props>();

const toast = useToast();
const dataList = ref({
    data: [],
    meta: { hasNextPage: false, hasPreviousPage: false, page: 0, pageCount: 0, take: 0, totalCount: 0 }
});
const currentPage = ref(1);
const rowsPerPage = ref(10);

const searchWord = ref('');
const prevSearchWord = ref("");

const breadcrumbRoutes = [
    { label: props.viewTitle.charAt(0).toUpperCase() + props.viewTitle.slice(1), to: { name: `${props.viewTitle.toLowerCase()}-default` } },
    { label: 'Table', to: { name: `${props.viewTitle.toLowerCase()}-default` } },
];

const fetchDataList = async () => {
    dataList.value = await props.fetchData(currentPage.value, rowsPerPage.value);
};

const onDelete = async (item: any) => {
    const originalData = [...dataList.value.data];
    dataList.value.data = dataList.value.data.filter((dataItem: any) => dataItem.id !== item.id);
    try {
        await props.deleteData(item.id);
        showToast(toast, {
            summary: 'Item deleted',
            detail: `Item: ${item.id}`,
            severity: "info"
        });
    } catch (error) {
        dataList.value.data = originalData;
        showToast(toast, {
            summary: "Item wasn't deleted",
            detail: `Item: ${item.id}`,
            severity: "error"
        });
    }
};

const toRouteBase = (value: string) => value.toLowerCase().replace(/\s+/g, '-');
const routeBase = ref(props.routeBase ?? toRouteBase(props.viewTitle));

const editRoute = props.editRoute ?? routeBase.value;
const createNewRouteTarget = () => {
    if (props.createNewRoute) {
        return props.createNewRoute.startsWith('/')
            ? { path: props.createNewRoute }
            : { name: props.createNewRoute };
    }

    return { name: `${routeBase.value}-create` };
};

const debounce = (fn: Function, delay: number) => {
    let timeoutId: number;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

const handlePageChange = (event: any) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if (searchWord.value) {
        onSearch();
    } else {
        fetchDataList();
    }
};


const clearSearch = () => {
    searchWord.value = "";
    prevSearchWord.value = "";
    onSearch();
};

const debouncedSearch = debounce(async () => {

    if (!searchWord.value) {
        currentPage.value = 1
        await fetchDataList();
        return;
    }

    if (currentPage.value !== 1 && prevSearchWord.value !== searchWord.value) {
        currentPage.value = 1;
    }

    dataList.value = await props.searchData(searchWord.value, currentPage.value, rowsPerPage.value);


    prevSearchWord.value = searchWord.value;
}, 450);

const onSearch = () => {
    debouncedSearch();
};

onMounted(async () => {
    fetchDataList();
});
</script>

<template>
    <BaseLayout :is-bread-crumb-visible="dontShowBreadCrumb" :breadcrumbRoutes="breadcrumbRoutes">

        <template #view-title>{{ viewTitle }}</template>

        <template #create-new v-if="!lockCreateNew">
            <router-link :to="createNewRouteTarget()">New {{ viewTitle.toLowerCase() }}</router-link>
        </template>

        <template #header-search>
            <slot name="header-search" :search-word="searchWord" :on-search="onSearch" :clear-search="clearSearch" :set-search-word="(value: string) => { searchWord = value; onSearch(); }">
                <IconField>
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="searchWord" @input="onSearch" placeholder="Search" />
                    <InputIcon v-if="searchWord" class="pi pi-times cursor-pointer text-gray-500 hover:text-black"
                        @click="clearSearch" />
                </IconField>
            </slot>

        </template>

        <template #header-button v-if="$slots['header-button']">
            <slot name="header-button"></slot>
        </template>


        <template #card-content>

            <DataTable v-if="!props.useServicesTable" :data="dataList.data" :headers="headers" :onDelete="onDelete"
                :lockEdit="lockEdit" @page-change="handlePageChange" :total-records="dataList.meta.totalCount"
                :edit-route="editRoute" :show-export-button="props.showExportButton"
                :export-start-date="props.exportStartDate" :export-end-date="props.exportEndDate">
                <template #isActive="slotProps">
                    <slot name="isActive" v-bind="slotProps" />
                </template>
            </DataTable>

            <DataTableServices v-if="props.useServicesTable" :data="dataList.data" :headers="headers"
                :onDelete="onDelete" :lockEdit="lockEdit" @page-change="handlePageChange"
                :total-records="dataList.meta.totalCount" :edit-route="editRoute" @update="fetchDataList" />

        </template>
    </BaseLayout>
</template>
