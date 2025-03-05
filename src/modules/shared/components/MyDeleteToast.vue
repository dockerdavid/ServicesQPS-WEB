<template>
    <Toast position="bottom-center" group="bc" @close="$emit('close')">
        <template #message="slotProps">
            <div class="flex flex-col items-start flex-auto">
                <div class="py-2">{{ slotProps.message.summary }}</div>
                <div class="flex justify-between gap-6">
                    <Button icon="pi pi-trash" label="Yes, delete." severity="danger" @click="$emit('delete')" />
                    <Button severity="contrast" label="Cancel" variant="text" @click="$emit('close')" />
                </div>
            </div>
        </template>
    </Toast>
</template>

<script setup lang="ts">
import { Button, Toast } from 'primevue';

defineEmits(['delete', 'close']);
</script>