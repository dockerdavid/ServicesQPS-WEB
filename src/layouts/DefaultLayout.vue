<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import router from '../router';
import { Avatar, Button, Card, Popover } from 'primevue';

import MySidebar from '../modules/shared/components/MySidebar.vue';

import { useSidebarStore } from '../store/sidebar.store';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';
import {
    isNotificationSupported,
    requestNotificationPermission,
} from '../utils/web-notifications';

const sidebarState = useSidebarStore();
const store = useUserStore();

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

const canRequestNotifications = computed(
    () => notificationSupported.value && notificationPermission.value === 'default',
);

const requestNotifications = async () => {
    notificationPermission.value = await requestNotificationPermission();
};

onMounted(() => {
    notificationSupported.value = isNotificationSupported();
    if (notificationSupported.value) {
        notificationPermission.value = Notification.permission;
    }
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
