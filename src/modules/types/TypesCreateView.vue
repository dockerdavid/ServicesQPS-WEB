<template>

    <CreateLayout>

        <template #view-title>Create Type</template>

        <template #inputs>

            <MyInputGroup label="Description" input-id="description" input-type="input" />
            <MyInputGroup label="Cleaning type" input-id="cleaning-type" input-type="input" />
            <MyInputGroup label="Price" input-id="price" input-type="numeric" />
            <MyInputGroup label="Community" input-id="community" input-type="select" />
            <MyInputGroup label="Commision" input-id="commision" input-type="numeric" />

            <div />

            <div>
                <Button>Create</Button>
            </div>

        </template>

    </CreateLayout>

</template>

<script setup>
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { Button } from 'primevue';


</script>
