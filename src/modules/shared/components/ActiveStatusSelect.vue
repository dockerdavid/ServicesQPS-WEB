<script setup lang="ts">
import { Select } from "primevue";
import type { StatusFilter } from "../composables/useStatusFilter";

const model = defineModel<StatusFilter>({ default: 'active' });

const options = [
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Todos', value: 'all' },
];
</script>

<template>
    <Select v-model="model" :options="options" optionLabel="label" optionValue="value" class="min-w-[9rem]" />
</template>
