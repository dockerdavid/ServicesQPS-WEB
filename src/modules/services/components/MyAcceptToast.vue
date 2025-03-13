<template>
    <Toast position="bottom-center" group="accept" @close="$emit('close')">
        <template #message="slotProps">
            <div class="flex flex-col items-start flex-auto">
                <div class="py-2">{{ slotProps.message.summary }}</div>
                <div class="flex justify-between gap-6">
                    <Button icon="pi pi-check" label="Yes, accept." severity="warn" @click="$emit('accept')" />
                    <Button severity="contrast" label="Cancel" variant="text" @click="$emit('close')" />
                </div>
            </div>
        </template>
    </Toast>
</template>

<script setup lang="ts">
import { Button, Toast } from 'primevue';

defineEmits(['accept', 'close']);
</script>