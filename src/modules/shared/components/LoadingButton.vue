<template>
    <Button :loading="isLoading" :severity="severity || 'warn'">
        <p v-if="!isLoading"> {{ label || 'Create' }} </p>
    </Button>
</template>

<script setup lang="ts">
import { Button } from 'primevue';

import { useGlobalStateStore } from '@/store/auth.store';
import { storeToRefs } from 'pinia';

type severity = 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'

interface ButtonProps {
    label?: string
    severity?: severity
}

const { isLoading } = storeToRefs(useGlobalStateStore());

defineProps<ButtonProps>();

</script>
