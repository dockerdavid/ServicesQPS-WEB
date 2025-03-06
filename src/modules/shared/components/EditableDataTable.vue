<script setup lang="ts">
import { ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, InputText, Button, Skeleton } from "primevue";
import MyDeleteToast from "./MyDeleteToast.vue";
import { useGlobalStateStore } from "@/store/auth.store";
import { storeToRefs } from "pinia";

interface TableI {
    data: any[];
    headers: { field: string; name: string; style?: string }[];
    editableColumns: string[];
    onDelete: (item: any) => void;
}

const { isLoading } = storeToRefs(useGlobalStateStore());
const loadingEdit = ref(false);

const props = defineProps<TableI>();
const emit = defineEmits(['update']);
const toast = useToast();

const simulateRequest = async (): Promise<boolean> => {
    loadingEdit.value = true
    return new Promise((resolve) => {
        setTimeout(() => {
            const success = Math.random() < 0.8;
            resolve(success);
            loadingEdit.value = false
        }, 1000);
    });
};

const onCellEditComplete = async (event: { data: any; newValue: any; field: string }) => {
    const { data, newValue, field } = event;

    if (data[field] === newValue) return;

    const success = await simulateRequest();

    if (success) {
        emit('update', { data, newValue, field });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Data was updated',
            life: 3000,
        });
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Data was not updated',
            life: 3000,
        });
    }
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

        <DataTable v-else-if="data.length > 0" edit-mode="cell" :value="data" paginator :rows="10"
            :rowsPerPageOptions="[10, 20, 40]" tableStyle="min-width: 50rem" @cell-edit-complete="onCellEditComplete">

            <Column v-for="(header, index) in headers" :key="index" :field="header.field" :header="header.name"
                :style="header.style">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>

            <Column field="actions" style="width: 25%">
                <template #body="{ data }">
                    <div class="flex justify-around">
                        <Button variant="text" icon="pi pi-trash" severity="danger" label="Delete"
                            @click="showDeleteToast(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <div v-else>
            <p class="text-center py-4 text-2xl">There is no data</p>
        </div>

        <!-- Toast de eliminación -->
        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />

    </div>
</template>