<template>
    <CreateLayout>

        <template #view-title> Create Extra </template>

        <template #inputs>

            <MyInputGroup label="Item" inputId="item" input-type="input" />
            <MyInputGroup placeholder="$0.00" label="Item price" inputId="item-price" input-type="numeric" />
            <MyInputGroup placeholder="$0.00" label="Comission" inputId="commision" input-type="numeric" />

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