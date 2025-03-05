<template>
    <CreateLayout>

        <template #view-title> Create Company </template>

        <template #inputs>

            <MyInputGroup label="Company name" inputId="name" input-type="input" />

            <div />

            <div>
                <Button>Create</Button>
            </div>

        </template>



    </CreateLayout>
</template>

<script setup lang="ts">
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { Button } from 'primevue';

</script>

<style lang="scss" scoped></style>