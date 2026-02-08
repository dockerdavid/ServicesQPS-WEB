<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useToast } from 'primevue/usetoast';
import { Column, DataTable, Button, Skeleton, Paginator, Dialog } from "primevue";
import { io, type Socket } from 'socket.io-client';
import MyDeleteToast from "../../shared/components/MyDeleteToast.vue";
import { useAuthStore, useGlobalStateStore } from "../../../store/auth.store";
import { storeToRefs } from "pinia";
import router from "../../../router";
import { useUserStore } from "../../../store/user.store";
import {  CleanerServiceAdapterExternal, type EditService, type ExternalService, type Service } from "../../../../src/interfaces/services/services.interface";
import MyConfirmToast from "./MyCompleteToast.vue";
import MyAcceptToast from "./MyAcceptToast.vue";
import MyRejectToast from "./MyRejectToast.vue";
import MyChatToast from "./MyChatToast.vue";
import { showToast } from "../../../../src/utils/show-toast";
import { CleanersServices } from "../services.services";
import ServiceChatPanel from "./ServiceChatPanel.vue";
import { showWebNotification, isNotificationSupported, getNotificationPermission } from "../../../utils/web-notifications";

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
const authStore = useAuthStore();

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
const socket = ref<Socket | null>(null);

interface ChatNotificationPayload {
    serviceId: string;
    senderId: string;
    senderName: string;
    message: string | null;
    hasAttachment: boolean;
    communityName: string | null;
    unitNumber: string | null;
}

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

const socketUrl = computed(() => {
    const baseUrl = import.meta.env.VITE_API_URL as string;
    return baseUrl?.replace(/\/$/, '');
});

const truncateText = (value: string, maxLength: number) => {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
};

const buildChatPreview = (payload: ChatNotificationPayload) => {
    const baseMessage = payload.message?.trim() ?? '';
    if (baseMessage) {
        return truncateText(baseMessage, 120);
    }

    return payload.hasAttachment ? 'Sent an attachment.' : 'Sent a new message.';
};

const showNativeNotification = (payload: ChatNotificationPayload) => {
    if (!isNotificationSupported() || getNotificationPermission() !== 'granted') {
        return;
    }

    const sender = payload.senderName || 'Someone';
    const community = payload.communityName || 'Service';
    const unit = payload.unitNumber ? ` · Unit ${payload.unitNumber}` : '';
    const preview = buildChatPreview(payload);
    const body = `${sender} — ${community}${unit}\n${preview}`;

    showWebNotification('New chat message', {
        body,
        tag: `service-chat-${payload.serviceId}`,
        data: { serviceId: payload.serviceId },
        onClick: () => {
            window.focus();
            handleChatToastOpen(payload.serviceId);
        },
    });
};

const showChatToast = (payload: ChatNotificationPayload) => {
    const sender = payload.senderName || 'Someone';
    const community = payload.communityName || 'Service';
    const unit = payload.unitNumber ? ` · Unit ${payload.unitNumber}` : '';
    const detail = `${community}${unit} — ${buildChatPreview(payload)}`;

    toast.add({
        group: 'chat',
        severity: 'info',
        summary: `New message from ${sender}`,
        detail,
        data: { serviceId: payload.serviceId },
        life: 10000,
    });
};

const handleChatToastOpen = async (serviceId: string) => {
    toast.removeGroup('chat');

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

const closeChatToast = () => {
    toast.removeGroup('chat');
};

const handleChatNotification = (payload: ChatNotificationPayload) => {
    if (!payload?.serviceId) {
        return;
    }

    if (payload.senderId && payload.senderId === store.userData?.id) {
        return;
    }

    if (isChatDialogOpen.value && activeChatService.value?.id === payload.serviceId) {
        return;
    }

    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        showNativeNotification(payload);
    }

    showChatToast(payload);
};

const connectNotificationSocket = () => {
    if (socket.value || !authStore.token || !canAccessChat.value) {
        return;
    }

    socket.value = io(socketUrl.value, {
        auth: { token: authStore.token },
        transports: ['websocket'],
    });

    socket.value.on('serviceChat:notify', handleChatNotification);
    socket.value.on('serviceChat:error', (payload: { message?: string }) => {
        if (payload?.message) {
            showToast(toast, { severity: 'error', summary: payload.message });
        }
    });
};

const disconnectNotificationSocket = () => {
    if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
    }
};

watch(
    () => [authStore.token, canAccessChat.value],
    ([token, allowed]) => {
        if (token && allowed) {
            connectNotificationSocket();
            return;
        }

        disconnectNotificationSocket();
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    disconnectNotificationSocket();
});

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
        <MyChatToast @open="handleChatToastOpen" @close="closeChatToast" />

        <Dialog v-model:visible="isChatDialogOpen" modal header="Service chat" :style="{ width: 'min(720px, 94vw)' }"
            @hide="closeChat">
            <ServiceChatPanel v-if="activeChatService" :service="activeChatService" />
        </Dialog>

    </div>
</template>
