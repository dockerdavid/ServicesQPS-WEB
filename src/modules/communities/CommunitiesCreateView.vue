<template>
    <CreateLayout>

        <template #view-title> Create Community </template>

        <template #inputs>

            <div>
                <label></label>
                <InputText></InputText>
            </div>

        </template>

    </CreateLayout>
</template>

<script setup lang="ts">
import CreateLayout from '@/layouts/CreateLayout.vue';
import { InputText } from 'primevue';
</script>

<style lang="scss" scoped>
input,
select {
    width: 100%;
}
</style>