<template>
    <Button :label="label || 'Create'" :loading="isLoading">
    </Button>
</template>

<script setup lang="ts">
import { Button } from 'primevue';

import { useGlobalStateStore } from '../../../store/auth.store';
import { storeToRefs } from 'pinia';

interface ButtonProps {
    label?: string 
}

const { isLoading } = storeToRefs(useGlobalStateStore());

defineProps<ButtonProps>();

</script>
