<template>
    <div class="default-layout">

        <MySidebar />

        <main>

            <Card>
                <template #content>
                    <div class="user-header py-1">

                        <Icon icon="ph:arrows-left-right" @click="sidebarState.toggleSidebar()" />

                        <Avatar label="P" class="mr-2" size="normal" shape="circle" />
                    </div>
                </template>
            </Card>

            <RouterView />

        </main>
    </div>
</template>

<script setup>
import { Avatar } from 'primevue';
import { Card } from 'primevue';

import MySidebar from '@/components/MySidebar.vue';

import { useSidebarStore } from '@/store/sidebar.store';

const sidebarState = useSidebarStore();

</script>

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