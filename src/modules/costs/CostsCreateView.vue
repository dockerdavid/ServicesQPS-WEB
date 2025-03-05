<template>
    <CreateLayout>

        <template #view-title> Create Cost </template>

        <template #inputs>

            <MyInputGroup label="Date" inputId="date" input-type="datepicker" icon="calendar" />
            <MyInputGroup label="Description" inputId="description" input-type="input" />
            <MyInputGroup label="Amount" inputId="amount" input-type="numeric" />

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