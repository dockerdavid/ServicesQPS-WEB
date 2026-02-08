<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, Button, Skeleton, Paginator, Dialog } from "primevue";
import MyDeleteToast from "../../shared/components/MyDeleteToast.vue";
import { useGlobalStateStore } from "../../../store/auth.store";
import { storeToRefs } from "pinia";
import router from "../../../router";
import { useRoute } from "vue-router";
import { useUserStore } from "../../../store/user.store";
import {  CleanerServiceAdapterExternal, type EditService, type ExternalService, type Service } from "../../../../src/interfaces/services/services.interface";
import MyConfirmToast from "./MyCompleteToast.vue";
import MyAcceptToast from "./MyAcceptToast.vue";
import MyRejectToast from "./MyRejectToast.vue";
import { showToast } from "../../../../src/utils/show-toast";
import { CleanersServices } from "../services.services";
import ServiceChatPanel from "./ServiceChatPanel.vue";

// Función para manejar campos anidados de forma segura
const getNestedValue = (obj: any, path: string): string => {
    if (!obj) return '';
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return '';
        }
    }
    
    return value || '';
};



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
const route = useRoute();

const props = defineProps<TableI>();
const emit = defineEmits(['update', 'page-change']);
const toast = useToast();


const rows = ref(10);
const first = ref(0);

const onPageChange = (event: any) => {
    console.log('DataTableServices - onPageChange event:', event);
    console.log('DataTableServices - props.data length:', props.data.length);
    first.value = event.first;
    rows.value = event.rows;
    emit('page-change', event);
};

const redirectToEdit = (id: string) => {
    router.push({ name: `${props.editRoute}-edit`, params: { id } });
}

const itemToDelete = ref<Service | null>();
const itemToUpdate = ref<EditService | null>();
const itemToUpdateId = ref('');
const isChatDialogOpen = ref(false);
const activeChatService = ref<Service | ExternalService | null>(null);

const canAccessChat = computed(() => {
    const roleId = store.userData?.roleId ?? '';
    const roleName = store.userData?.role?.name?.toLowerCase() ?? '';
    return roleId === '1'
        || roleId === '4'
        || roleId === '7'
        || roleName === 'super_admin'
        || roleName === 'qa'
        || roleName === 'cleaner';
});

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
const showToastByAction = (item: ExternalService, newStatus: string) => {

    itemToUpdateId.value = item.id
    const internalItem = CleanerServiceAdapterExternal.externalToInternal(item);
    itemToUpdate.value = internalItem;

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

    // Convertimos itemToUpdate a EditService
    const updatedService: EditService = {
        ...itemToUpdate.value,
        statusId: newStatus,
        userComment: comment || itemToUpdate.value.userComment || '',
        userId: itemToUpdate.value.userId || store.userData?.id || '',
    };

    await CleanersServices.updateService(itemToUpdateId.value, updatedService);

    showToast(toast, { summary: 'Service status updated', severity: 'success' });
    emit('update');
};


const closeToastByAction = (group: string) => {
    toast.removeGroup(group);
};

const openChat = (service: Service | ExternalService) => {
    activeChatService.value = service;
    isChatDialogOpen.value = true;
};

const closeChat = () => {
    isChatDialogOpen.value = false;
    activeChatService.value = null;
};

const openChatById = async (serviceId: string) => {
    if (!serviceId) {
        return;
    }

    if (activeChatService.value?.id === serviceId && isChatDialogOpen.value) {
        return;
    }

    const existing = props.data.find((service: any) => service.id === serviceId);
    if (existing) {
        openChat(existing);
        return;
    }

    try {
        const fetched = await CleanersServices.getServiceById(serviceId);
        openChat(fetched);
    } catch (error) {
        showToast(toast, { severity: 'error', summary: 'Unable to open chat.' });
    }
};

watch(
    () => route.query.chatServiceId,
    (value) => {
        const serviceId = Array.isArray(value) ? value[0] : value;
        if (!serviceId) {
            return;
        }

        openChatById(serviceId);

        const nextQuery = { ...route.query };
        delete (nextQuery as Record<string, any>).chatServiceId;
        router.replace({ name: 'services-default', query: nextQuery });
    },
    { immediate: true },
);

</script>

<template>
    <div>

        <div v-if="isLoading" class="flex flex-col gap-y-2 py-4">
            <Skeleton v-for="i in 5" class="w-100 py-6" />
        </div>

        <div v-else-if="props.data.length > 0">
            <DataTable :value="props.data" tableStyle="min-width: 50rem">

                <Column v-for="(header, index) in headers" :key="index" :header="header.name"
                    :style="header.style">
                    <template #body="{ data }">
                        <span>{{ getNestedValue(data, header.field) }}</span>
                    </template>
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
                    <template #body="{ data }: { data: ExternalService }">
                        <div class="flex justify-around">

                            <Button v-if="data.statusId == '2'" variant="text" icon="pi pi-check" severity="warn"
                                label="Accept" @click="showToastByAction(data, '3')" />

                            <Button v-if="data.statusId === '2'" variant="text" icon="pi pi-times" severity="danger"
                                label="Reject" @click="showToastByAction(data, '4')" />

                            <Button v-if="data.statusId === '3'" variant="text" icon="pi pi-verified" severity="warn"
                                label="Complete" @click="showToastByAction(data, '5')" />
                        </div>
                    </template>
                </Column>

                <Column v-if="canAccessChat" field="chat" style="width: 15%" header="Chat">
                    <template #body="{ data }">
                        <div class="flex justify-center">
                            <Button variant="text" icon="pi pi-comments" label="Chat" @click="openChat(data)" />
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
                <img class="w-70 " src="../../../../public/svgs/empty.svg">
            </picture>
        </div>

        <MyDeleteToast @delete="handleDelete" @close="closeDeleteToast" />
        <MyAcceptToast @accept="handleAction('3', 'accept')" @close="closeToastByAction('accept')" />
        <MyRejectToast @reject="(comment) => handleAction('4', 'reject', comment)"
            @close="closeToastByAction('reject')" />
        <MyConfirmToast @confirm="handleAction('5', 'complete')" @close="closeToastByAction('confirm')" />

        <Dialog v-model:visible="isChatDialogOpen" modal header="Service chat" :style="{ width: 'min(720px, 94vw)' }"
            @hide="closeChat">
            <ServiceChatPanel v-if="activeChatService" :service="activeChatService" />
        </Dialog>

    </div>
</template>
