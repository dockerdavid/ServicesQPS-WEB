<script setup lang="ts">
import { Button, Card, Chip, Column, DataTable, IconField, InputText, Popover, InputGroupAddon, Breadcrumb } from 'primevue';
</script>

<template>
    <div class="py-2">
        <Breadcrumb :model="[{ label: 'Companies' }, { label: 'Table' }]" />
        <div class="d-flex justify-between align-center">
            <!-- Slot para el título -->
            <h1>
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
                <div v-if="$slots['header-button']" class="d-flex justify-end p-2 border-bottom">
                    <slot name="header-button"></slot>
                </div>
                <div v-if="$slots['header-search']" class="d-flex justify-end p-2 border-bottom">
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