<script setup lang="ts">
import { Breadcrumb, Button, Card } from 'primevue';
import { useUserStore } from '../../src/store/user.store';

interface BreadcrumbRoute {
    label: string;
    to?: object;
}

const props = defineProps({
    breadcrumbRoutes: {
        type: Array as () => BreadcrumbRoute[],
        required: true,
    },
    isBreadCrumbVisible: {
        type: Boolean,
        required: false
    }
}

);

const userStore = useUserStore();

</script>

<template>
    <div class="py-6 page-header">

        <Breadcrumb :model="breadcrumbRoutes" v-if="!isBreadCrumbVisible" />

        <div class="flex justify-between items-center page-title-row">
            <!-- Slot para el título -->
            <h1 class="text-3xl page-title">
                <slot name="view-title">
                    Page title
                </slot>
            </h1>
            <!-- Slot para el botón "Create new" -->
            <div v-if="$slots['create-new']">
                <Button v-if="userStore.userData?.roleId !== '4' ">
                    <slot name="create-new"></slot>
                </Button>
            </div>

        </div>
    </div>

    <Card>
        <template #header>

            <slot name="card-header">
                <div v-if="$slots['header-button']" class="flex justify-end p-4 border-b border-gray-300 card-header-row">
                    <slot name="header-button"></slot>
                </div>
                <div v-if="$slots['header-search']" class="flex justify-end p-4 border-b border-gray-300 card-header-row">
                    <slot name="header-search"></slot>
                </div>
            </slot>

        </template>

        <template #content>
            <slot name="card-content"></slot>
        </template>
    </Card>
</template>

<style lang="scss" scoped>
.button-unstyled {
    background: none;
    border: none;
}

.page-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.page-title-row {
    padding-bottom: 0.25rem;
    border-bottom: 1px solid rgba(208, 213, 221, 0.6);
}

.page-title {
    font-family: "Space Grotesk", "IBM Plex Sans", sans-serif;
    font-weight: 600;
}

.card-header-row {
    border-bottom-color: rgba(208, 213, 221, 0.6);
}

</style>
