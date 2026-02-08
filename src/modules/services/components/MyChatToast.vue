<template>
  <Toast position="bottom-right" group="chat" @close="$emit('close')">
    <template #message="slotProps">
      <div class="flex flex-col gap-3">
        <div>
          <p class="font-semibold">{{ slotProps.message.summary }}</p>
          <p v-if="slotProps.message.detail" class="text-sm text-slate-600">
            {{ slotProps.message.detail }}
          </p>
        </div>
        <div class="flex gap-3">
          <Button
            icon="pi pi-comments"
            label="Open chat"
            severity="info"
            @click="handleOpen"
          />
          <Button label="Dismiss" variant="text" severity="secondary" @click="$emit('close')" />
        </div>
      </div>
    </template>
  </Toast>
</template>

<script setup lang="ts">
import { Button, Toast } from 'primevue';

const props = defineProps<{ serviceId?: string | null }>();
const emit = defineEmits(['open', 'close']);

const handleOpen = () => {
  if (!props.serviceId) {
    emit('close');
    return;
  }
  emit('open', props.serviceId);
};
</script>
