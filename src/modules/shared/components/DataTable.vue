<script setup lang="ts">
<<<<<<< HEAD
import { ref, computed } from "vue";
=======
import { ref } from "vue";
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, InputText, Button, Skeleton, Paginator } from "primevue";
import MyDeleteToast from "./MyDeleteToast.vue";
import { useGlobalStateStore } from "../../../store/auth.store";
import { storeToRefs } from "pinia";
import router from "../../../router";

interface TableI {
    data: any[];
    headers: { field: string; name: string; style?: string }[];
    onDelete: (item: any) => void;
    totalRecords: number;
    editRoute: string;
    lockEdit?: boolean;
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
</script>

<template>
    <div>

        <div v-if="isLoading" class="flex flex-col gap-y-2 py-4">
            <Skeleton v-for="i in 5" class="w-100 py-6" />
        </div>

        <div v-else-if="data.length > 0">
            <DataTable :value="data" tableStyle="min-width: 50rem">
                <Column v-for="(header, index) in headers" :key="index" :field="header.field" :header="header.name"
                    :style="header.style">
                    <template #editor="{ data, field }">
                        <InputText v-model="data[field]" />
                    </template>
                </Column>

                <Column v-if="!props.lockEdit" field="actions" style="width: 25%">
                    <template #body="{ data }">
                        <div class="flex justify-around">
                            <Button variant="text" icon="pi pi-pencil" severity="warn" label="Edit"
                                @click="redirectToEdit(data.id)" />
                            <Button variant="text" icon="pi pi-trash" severity="danger" label="Delete"
                                @click="showDeleteToast(data)" />
                        </div>
                    </template>
                </Column>

            </DataTable>

            <Paginator :rows="rows" :totalRecords="totalRecords" :rowsPerPageOptions="[5, 10, 20]" :first="first"
                @page="onPageChange" />
        </div>

        <div v-else class="py-2">
            <a href="https://storyset.com/search"></a>
            <picture class="flex items-center flex-col">
                <p class="text-2xl text-center py-4">There is no data. Please try a different search.</p>
<<<<<<< HEAD
                <img class="w-70 " src="../../../assets/empty.svg">
=======
                <img class="w-70 " src="../../../../public/svgs/empty.svg">
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
            </picture>
        </div>


        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />
    </div>
</template>
