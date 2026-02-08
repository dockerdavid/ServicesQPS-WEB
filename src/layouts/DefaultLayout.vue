<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import router from '../router';
import { Avatar, Button, Card, Popover } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { io, type Socket } from 'socket.io-client';

import MySidebar from '../modules/shared/components/MySidebar.vue';
import MyChatToast from '../modules/services/components/MyChatToast.vue';

import { useSidebarStore } from '../store/sidebar.store';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import {
    isNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    showWebNotification,
} from '../utils/web-notifications';

const sidebarState = useSidebarStore();
const store = useUserStore();
const authStore = useAuthStore();
const toast = useToast();

// Referencia al componente Popover (no un booleano)
const op = ref<InstanceType<typeof Popover> | null>(null);

const toggle = (event: any) => {
    op.value?.toggle?.(event); // Llamada segura al método toggle
};

const signOut = () => {
    useAuthStore().removeToken();
    useUserStore().removeUserData();
    router.push('/auth');
};

const notificationPermission = ref<NotificationPermission>('default');
const notificationSupported = ref(false);
const chatToastServiceId = ref<string | null>(null);
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

const canRequestNotifications = computed(
    () => notificationSupported.value && notificationPermission.value === 'default',
);

const requestNotifications = async () => {
    notificationPermission.value = await requestNotificationPermission();
};

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

const socketUrl = computed(() => {
    const baseUrl = import.meta.env.VITE_API_URL as string;
    return baseUrl?.replace(/\/$/, '');
});

const playNotificationSound = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
            return;
        }
        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
        oscillator.onended = () => {
            context.close().catch(() => null);
        };
    } catch (error) {
        // Ignore audio errors (browser may block autoplay)
    }
};

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

    chatToastServiceId.value = payload.serviceId;
    toast.add({
        group: 'chat',
        severity: 'info',
        summary: `New message from ${sender}`,
        detail,
        life: 10000,
    });
};

const handleChatNotification = (payload: ChatNotificationPayload) => {
    if (!payload?.serviceId) {
        return;
    }

    if (payload.senderId && payload.senderId === store.userData?.id) {
        return;
    }

    playNotificationSound();

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
            toast.add({ severity: 'error', summary: payload.message });
        }
    });
};

const disconnectNotificationSocket = () => {
    if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
    }
};

const handleChatToastOpen = (serviceId: string) => {
    toast.removeGroup('chat');
    chatToastServiceId.value = null;

    if (!serviceId) {
        return;
    }

    router.push({ name: 'services-default', query: { chatServiceId: serviceId } });
};

const closeChatToast = () => {
    toast.removeGroup('chat');
    chatToastServiceId.value = null;
};

onMounted(() => {
    notificationSupported.value = isNotificationSupported();
    if (notificationSupported.value) {
        notificationPermission.value = Notification.permission;
    }
});

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
    <div class="default-layout">

        <MySidebar />

        <main>
            <header class="topbar">
                <div class="topbar-left">
                    <Button class="sidebar-toggle" unstyled @click="sidebarState.toggleSidebar()">
                        <Icon icon="ph:arrows-left-right" />
                    </Button>
                </div>
                <div class="topbar-right">
                    <Button
                        v-if="canRequestNotifications"
                        class="notify-button"
                        icon="pi pi-bell"
                        label="Enable notifications"
                        severity="secondary"
                        @click="requestNotifications"
                    />
                    <Button class="avatar-button" unstyled @click="toggle">
                        <Avatar
                            :label="store.userData?.name?.charAt(0).toUpperCase() ?? '?'"
                            size="normal"
                            shape="circle"
                        />
                    </Button>
                    <Popover ref="op">
                        <div class="w-[10rem]">
                            <Button variant="text" icon="pi pi-sign-out" label="Sign out" @click="signOut" />
                        </div>
                    </Popover>
                </div>
            </header>

            <RouterView />
            <MyChatToast :service-id="chatToastServiceId" @open="handleChatToastOpen" @close="closeChatToast" />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.default-layout {
    display: flex;

    main {
        flex: 1;
        height: 100vh;
        overflow: auto;
        padding: 1.25rem 2.5rem 2rem;
        background: var(--page-gradient);

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 1rem;
            margin-bottom: 1.5rem;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid var(--border-soft);
            border-radius: 14px;
            box-shadow: var(--shadow-tight);
            backdrop-filter: blur(12px);
            position: static;
        }

        .topbar-left,
        .topbar-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .sidebar-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 12px;
            border: 1px solid var(--border-soft);
            background: #ffffff;
            transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }

        .sidebar-toggle:hover {
            background: var(--accent-100);
            border-color: var(--accent-200);
            transform: translateY(-1px);
        }

        .sidebar-toggle .iconify {
            font-size: 1.35rem;
            color: var(--ink-700);
        }

        .avatar-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 999px;
            border: 1px solid var(--border-soft);
            background: #ffffff;
            transition: box-shadow 0.2s ease;
        }

        .avatar-button:hover {
            box-shadow: var(--shadow-tight);
        }

        .notify-button {
            border-radius: 999px;
            font-weight: 600;
        }
    }
}
</style>
