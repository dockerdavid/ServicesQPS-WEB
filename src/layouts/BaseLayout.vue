<script setup lang="ts">
import { Breadcrumb, Button, Card } from 'primevue';

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


</script>

<template>
    <div class="py-6">

        <Breadcrumb :model="breadcrumbRoutes" v-if="!isBreadCrumbVisible"/>

        <div class="flex justify-between items-center">
            <!-- Slot para el título -->
            <h1 class="text-3xl">
                <slot name="view-title">
                    Page title
                </slot>
            </h1>
            <!-- Slot para el botón "Create new" -->
            <div v-if="$slots['create-new']">
                <Button>
                    <slot name="create-new"></slot>
                </Button>
            </div>

        </div>
    </div>

    <Card>
        <template #header>

            <slot name="card-header">
                <div v-if="$slots['header-button']" class="flex justify-end p-4 border-b border-gray-300">
                    <slot name="header-button"></slot>
                </div>
                <div v-if="$slots['header-search']" class="flex justify-end p-4 border-b border-gray-300">
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
</style>