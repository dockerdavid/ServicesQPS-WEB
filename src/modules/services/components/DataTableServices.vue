<script setup lang="ts">
import { ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, Button, Skeleton, Paginator } from "primevue";
import MyDeleteToast from "../../shared/components/MyDeleteToast.vue";
import { useGlobalStateStore } from "../../../store/auth.store";
import { storeToRefs } from "pinia";
import router from "../../../router";
import { useUserStore } from "../../../store/user.store";
import { CleanersServices } from "../../../../src/modules/services/services.services";
import type { EditService, Service } from "../../../../src/interfaces/services/services.interface";
import MyConfirmToast from "./MyCompleteToast.vue";
import MyAcceptToast from "./MyAcceptToast.vue";
import MyRejectToast from "./MyRejectToast.vue";
import { showToast } from "../../../../src/utils/show-toast";


interface TableI {
    data: Service[];
    headers: { field: string; name: string; style?: string }[];
    onDelete: (item: any) => void;
    totalRecords: number;
    editRoute: string;
    lockEdit?: boolean;
}

const { isLoading } = storeToRefs(useGlobalStateStore());

const store = useUserStore();

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

const itemToDelete = ref<Service | null>();
const itemToUpdate = ref<Service | null>();

const showDeleteToast = (item: Service) => {
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

//** ACCEPT, REJECT OR CONFIRM TOAST */
const showToastByAction = (item: Service, newStatus: string) => {
    itemToUpdate.value = item;

    let group: string;
    let summary: string;

    switch (newStatus) {
        case "3":
            group = "accept";
            summary = "Accept service?";
            break;

        case "4":
            group = "reject";
            summary = "Reject service?";
            break;

        case "5":
            group = "complete";
            summary = "Complete service?";
            break;

        default:
            group = "unknown";
            summary = "Unknown action";
            break;
    }

    toast.add({ group, summary, severity: 'warn' });
};

const handleAction = async (newStatus: string, group: string, comment?: string) => {
    if (itemToUpdate.value) {
        await handleCleanerDecision(newStatus, comment);
        itemToUpdate.value = null;
        toast.removeGroup(group);
    }
};

const handleCleanerDecision = async (newStatus: string, comment?: string) => {

    if (!itemToUpdate.value) return;

    const extraIds = itemToUpdate.value.extrasByServices.map((extra) => extra.extraId);

    const updatedService: EditService = {
        comment: itemToUpdate.value.comment || '',
        communityId: itemToUpdate.value.communityId,
        date: itemToUpdate.value.date,
        extraId: extraIds,
        schedule: itemToUpdate.value.schedule,
        statusId: newStatus,
        typeId: itemToUpdate.value.typeId,
        unitNumber: itemToUpdate.value.unitNumber,
        unitySize: itemToUpdate.value.unitySize,
        userComment: comment || itemToUpdate.value.userComment || '',
        userId: itemToUpdate.value.userId || store.userData?.id || '',
    };

    await CleanersServices.updateService(itemToUpdate.value.id, updatedService);

    showToast(toast, { summary: 'Service status updated', severity: 'success' })
    emit('update')

};

const closeToastByAction = (group: string) => {
    toast.removeGroup(group);
};

</script>

<template>
    <div>

        <div v-if="isLoading" class="flex flex-col gap-y-2 py-4">
            <Skeleton v-for="i in 5" class="w-100 py-6" />
        </div>

        <div v-else-if="props.data.length > 0">
            <DataTable :value="props.data" tableStyle="min-width: 50rem">

                <Column v-for="(header, index) in headers" :key="index" :field="header.field" :header="header.name"
                    :style="header.style">
                </Column>

                <Column v-if="!props.lockEdit && store.userData?.roleId !== '4'" field="actions" style="width: 25%">
                    <template #body="{ data }">
                        <div class="flex justify-around">
                            <Button variant="text" icon="pi pi-pencil" severity="warn" label="Edit"
                                @click="redirectToEdit(data.id)" />
                            <Button v-if="!props.lockEdit && store.userData?.roleId === '1'"  variant="text" icon="pi pi-trash" severity="danger" label="Delete"
                                @click="showDeleteToast(data)" />
                        </div>
                    </template>
                </Column>

                <Column v-if="store.userData?.roleId === '4'" field="actions" style="width: 25%">
                    <template #body="{ data }: { data: Service }">
                        <div class="flex justify-around">

                            <Button v-if="data.statusId == '1'" variant="text" icon="pi pi-check" severity="warn"
                                label="Accept" @click="showToastByAction(data, '3')" />

                            <Button v-if="data.statusId === '1'" variant="text" icon="pi pi-times" severity="danger"
                                label="Reject" @click="showToastByAction(data, '4')" />

                            <Button v-if="data.statusId === '3'" variant="text" icon="pi pi-verified" severity="warn"
                                label="Complete" @click="showToastByAction(data, '5')" />
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
                <img class="w-70 " src="../../../assets/empty.svg">
            </picture>
        </div>

        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />
        <MyAcceptToast @accept="handleAction('3', 'accept')" @close="closeToastByAction('accept')" />
        <MyRejectToast @reject="(comment) => handleAction('4', 'reject', comment)"
            @close="closeToastByAction('reject')" />
        <MyConfirmToast @confirm="handleAction('5', 'complete')" @close="closeToastByAction('confirm')" />

    </div>
</template>
