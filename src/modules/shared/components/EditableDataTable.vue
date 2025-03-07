<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, InputText, Button, Skeleton, Paginator } from "primevue";
import MyDeleteToast from "./MyDeleteToast.vue";
import { useGlobalStateStore } from "@/store/auth.store";
import { storeToRefs } from "pinia";

interface TableI {
    data: any[];
    headers: { field: string; name: string; style?: string }[];
    editableColumns: string[];
    onDelete: (item: any) => void;
    totalRecords: number;
}

const { isLoading } = storeToRefs(useGlobalStateStore());
const loadingEdit = ref(false);

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


const onCellEditComplete = async (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;

    if (data[field] === newValue) return;

    emit('update', { data, newValue, field });
};

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
</script>

<template>
    <div>
        <div v-if="isLoading" class="flex flex-col gap-y-2 py-4">
            <Skeleton v-for="i in 5" class="w-100 py-6" />
        </div>

        <div v-else-if="data.length > 0">
            <DataTable 
                edit-mode="cell" 
                :value="data" 
                tableStyle="min-width: 50rem"
                @cell-edit-complete="onCellEditComplete"
            >
                <Column 
                    v-for="(header, index) in headers" 
                    :key="index" 
                    :field="header.field" 
                    :header="header.name" 
                    :style="header.style"
                >
                    <template #editor="{ data, field }">
                        <InputText v-model="data[field]" />
                    </template>
                </Column>

                <Column field="actions" style="width: 25%">
                    <template #body="{ data }">
                        <div class="flex justify-around">
                            <Button 
                                variant="text" 
                                icon="pi pi-trash" 
                                severity="danger" 
                                label="Delete" 
                                @click="showDeleteToast(data)" 
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <Paginator 
                :rows="rows" 
                :totalRecords="totalRecords" 
                :rowsPerPageOptions="[5, 10, 20]" 
                :first="first"
                @page="onPageChange"
            />
        </div>

        <div v-else class="py-2">
            <a href="https://storyset.com/search"></a>
            <picture class="flex items-center flex-col">
                <p class="text-2xl text-center py-4">There is no data. Please try a different search.</p>
                <img class="w-70 " src="../../../assets/empty.svg">
            </picture>
        </div>


        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />
    </div>
</template>

