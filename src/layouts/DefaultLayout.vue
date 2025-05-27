<script lang="ts" setup>
import { ref } from 'vue';
import router from '../router';
import { Avatar, Button, Card, Popover } from 'primevue';

import MySidebar from '../modules/shared/components/MySidebar.vue';

import { useSidebarStore } from '../store/sidebar.store';
import { useAuthStore } from '../store/auth.store';
import { useUserStore } from '../store/user.store';

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
</script>

<template>
    <div class="default-layout">

        <MySidebar />

        <main>
            <Card>
                <template #content>
                    <div class="user-header py-1">
                        <Icon icon="ph:arrows-left-right" @click="sidebarState.toggleSidebar()" />
                        <div>
                            <Button class="cursor-pointer" unstyled @click="toggle">
                                <Avatar
                                    :label="store.userData?.name?.charAt(0).toUpperCase() ?? '?'"
                                    class="mr-2"
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
                    </div>
                </template>
            </Card>

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
        padding: 1rem 2rem;
        background-color: var(--color-body-background);

        .user-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .iconify {
                cursor: pointer;
            }
        }
    }
}
</style>
