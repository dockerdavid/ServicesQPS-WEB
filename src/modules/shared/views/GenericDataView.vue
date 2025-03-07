<script setup lang="ts">
import { onMounted, ref } from "vue";
import { IconField, InputIcon, InputText, useToast } from 'primevue';
import BaseLayout from '@/layouts/BaseLayout.vue';
import { showToast } from "@/utils/show-toast";
import EditableDataTable from "../components/EditableDataTable.vue";


interface Header {
    field: string;
    name: string;
    style?: string;
}

interface Props {
    viewTitle: string;
    createNewRoute: string;
    headers: Header[];
    editableColumns: string[];
    fetchData: (page: number, rows: number) => Promise<any>;
    deleteData: (id: string) => Promise<void>;
    updateData: (data: any) => Promise<void>;
    searchData: (data: string) => Promise<any>;
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
            detail: `Item: ${item.name || item.statusName}`,
            severity: "info"
        });
    } catch (error) {
        dataList.value.data = originalData;
        showToast(toast, {
            summary: "Item wasn't deleted",
            detail: `Item: ${item.name || item.statusName}`,
            severity: "error"
        });
    }
};


const handleUpdate = async (event: { data: any; newValue: any; field: string }) => {

    const { data, newValue, field } = event;

    const originalValue = data[field];

    data[field] = newValue;

    try {
        await props.updateData(data);

        showToast(toast, {
            summary: 'Update successful',
            detail: `Field: ${field}`,
            severity: "success"
        });

    } catch (error) {

        data[field] = originalValue;

        showToast(toast, {
            summary: "Update failed",
            detail: `Field: ${field}`,
            severity: "error"
        });
    }
};

const debounce = (fn: Function, delay: number) => {
    let timeoutId: number;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

const debouncedSearch = debounce(async () => {
    if (!searchWord.value) {
        await fetchDataList();
        return;
    }

    dataList.value = await props.searchData(searchWord.value);

}, 450);

const onSearch = () => {
    debouncedSearch();
};

const handlePageChange = (event: any) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    fetchDataList();
};



onMounted(async () => {
    fetchDataList();
});
</script>

<template>
    <BaseLayout :breadcrumbRoutes="breadcrumbRoutes">

        <template #view-title>{{ viewTitle }}</template>
        <template #create-new>
            <router-link :to="createNewRoute">New {{ viewTitle.toLowerCase() }}</router-link>
        </template>
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="searchWord" @input="onSearch" placeholder="Search" />
            </IconField>
        </template>
        <template #card-content>
            <EditableDataTable :data="dataList.data" :headers="headers" :editableColumns="editableColumns"
                :onDelete="onDelete" @update="handleUpdate" @page-change="handlePageChange"
                :total-records="dataList.meta.totalCount" />
        </template>
    </BaseLayout>
</template>