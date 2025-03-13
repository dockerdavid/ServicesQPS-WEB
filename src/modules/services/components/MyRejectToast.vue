<template>
    <Toast position="bottom-center" group="reject" @close="$emit('close')">
        <template #message="slotProps">
            <div class="flex flex-col items-start flex-auto">
                <div class="py-2">{{ slotProps.message.summary }}</div>

                <InputText v-model="comment" placeholder="Tell us why" :class="{ 'p-invalid': error }" />
                <small v-if="error" class="p-error">This field is required.</small>

                <div class="flex justify-between gap-6 pt-2">
                    <Button icon="pi pi-check" label="Yes, reject." severity="warn" @click="handleReject" />
                    <Button severity="contrast" label="Cancel" variant="text" @click="$emit('close')" />
                </div>
            </div>
        </template>
    </Toast>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button, InputText, Toast } from 'primevue';

const comment = ref('');
const error = ref(false);

const emit = defineEmits(['reject', 'close']);

const handleReject = () => {
    if (!comment.value.trim()) {
        error.value = true;
        return;
    }
    emit('reject', comment.value);
    emit('close');
};
</script>