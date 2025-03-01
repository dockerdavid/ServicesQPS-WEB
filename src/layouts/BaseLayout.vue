<script setup lang="ts">
import { Button, Card, Chip, Column, DataTable, IconField, InputText, Popover, InputGroupAddon, Breadcrumb } from 'primevue';
</script>

<template>
    <div class="py-6">
        <Breadcrumb :model="[{ label: 'Companies' }, { label: 'Table' }]" />
        <div class="flex justify-between items-center">
            <!-- Slot para el título -->
            <h1 class="text-3xl"> 
                <slot name="view-title">
                    Page title
                </slot>
            </h1>
            <!-- Slot para el botón "Create new" -->
            <div v-if="$slots['create-new']">
                <slot name="create-new">
                </slot>
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