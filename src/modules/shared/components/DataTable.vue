<script setup lang="ts">
import { ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, InputText, Button, Skeleton } from "primevue";
import MyDeleteToast from "./MyDeleteToast.vue";
import { useGlobalStateStore } from "../../../store/auth.store";
import { storeToRefs } from "pinia";
import router from "../../../router";
import { CommunitiesServices } from "../../../modules/communities/communities.services";

interface TableHeader {
    field: string;
    name: string;
    style?: string;
    format?: (value: any, row: any) => string;
    slotName?: string;
}

interface TableI {
    data: any[];
    headers: TableHeader[];
    onDelete: (item: any) => void;
    totalRecords: number;
    editRoute: string;
    lockEdit?: boolean;
    showExportButton?: boolean;
    exportStartDate?: string;
    exportEndDate?: string;
}

const { isLoading } = storeToRefs(useGlobalStateStore());

const props = defineProps<TableI>();
const emit = defineEmits(['update', 'page-change']);
const toast = useToast();

const rows = ref(10);
const first = ref(0);

const onPageChange = (event: any) => {
    first.value = event.first;
    rows.value = event.rows;
    emit('page-change', event);
};

const redirectToEdit = (id: string) => {
    router.push({ name: `${props.editRoute}-edit`, params: { id } });
}

const itemToDelete = ref<any>(null);

const showDeleteToast = (item: any) => {
    itemToDelete.value = item;
    toast.add({
        severity: 'error',
        summary: 'Delete item?',
        group: 'bc',
    });
};

const handleDelete = () => {
    if (itemToDelete.value) {
        props.onDelete(itemToDelete.value);
        itemToDelete.value = null;
        toast.removeGroup('bc');
    }
};

const closeDeleteToast = () => {
    toast.removeGroup('bc');
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => 
        current && current[key] !== undefined ? current[key] : '', 
        obj
    );
};

const handleExport = async (id: string) => {
    try {
        await CommunitiesServices.exportCommunityReport(id, props.exportStartDate, props.exportEndDate);
        toast.add({
            severity: 'success',
            summary: 'Export successful',
            detail: 'The community report has been exported successfully',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Export failed',
            detail: 'There was an error exporting the community report',
            life: 3000
        });
    }
};
</script>

<template>
    <div>

        <div v-if="isLoading" class="flex flex-col gap-y-2 py-4">
            <Skeleton v-for="i in 5" class="w-100 py-6" />
        </div>

        <div v-else-if="data.length > 0">
            <DataTable :value="data" :paginator="true" :lazy="true" :rows="rows" :first="first"
                :totalRecords="totalRecords" @page="onPageChange"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 20, 50]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                responsiveLayout="scroll">
                <Column v-for="header in headers" :key="header.field" :field="header.field" :header="header.name"
                    :style="header.style">
                    <template #body="{ data: rowData }">
                        <template v-if="header.slotName && $slots[header.slotName]">
                            <slot :name="header.slotName" :row="rowData" />
                        </template>
                        <template v-else-if="header.format">
                            <span v-html="header.format(getNestedValue(rowData, header.field), rowData)"></span>
                        </template>
                        <template v-else>
                            {{ getNestedValue(rowData, header.field) }}
                        </template>
                    </template>
                </Column>
                <Column v-if="!props.lockEdit" field="actions" style="width: 25%">
                    <template #body="{ data }">
                        <div class="flex justify-around">
                            <Button variant="text" icon="pi pi-pencil" severity="warn" label="Edit"
                                @click="redirectToEdit(data.id)" />
                            <Button v-if="props.showExportButton" variant="text" icon="pi pi-file-export" severity="info" label="Export"
                                @click="handleExport(data.id)" />
                            <Button variant="text" icon="pi pi-trash" severity="danger" label="Delete"
                                @click="showDeleteToast(data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>

        </div>

        <div v-else class="py-2">
            <a href="https://storyset.com/search"></a>
            <picture class="flex items-center flex-col">
                <p class="text-2xl text-center py-4">There is no data. Please try a different search.</p>
                <img class="w-70 " src="../../../../public/svgs/empty.svg">
            </picture>
        </div>


        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />
    </div>
</template>
