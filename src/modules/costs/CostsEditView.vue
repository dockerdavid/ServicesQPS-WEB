<script setup lang="ts">
import { ref } from 'vue';

import type { NewCost } from '@/interfaces/costs/costs.interface';
import MyInputGroup from '../shared/components/MyInputGroup.vue';

import CreateLayout from '@/layouts/CreateLayout.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { CostsServices } from './costs.services';
import { useToast } from 'primevue';
import { showToast } from '@/utils/show-toast';

const toast = useToast();

const newCost = ref<NewCost>({ amount: '', date: '', description: '' });

const breadcrumbRoutes = [
    { label: 'Costs', to: { name: 'costs-default' } },
    { label: 'Edit', to: { name: 'costs-edit' } },
];

const createCost = async () => {
    newCost.value.amount = newCost.value.amount.toString();
    try {
        await CostsServices.createCost(newCost.value)
        showToast(toast, { severity: 'success', summary: 'Cost updated' })
        newCost.value = { amount: '', date: '', description: '' }
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Cost wasn't updated" })
    }
}

</script>


<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title> Edit Cost </template>

        <template #inputs>

            <MyInputGroup v-model="newCost.date" label="Date" inputId="date" input-type="datepicker" icon="calendar" />
            <MyInputGroup v-model="newCost.description" label="Description" inputId="description" input-type="input" />
            <MyInputGroup v-model="newCost.amount" label="Amount" inputId="amount" input-type="numeric" />

            <div />

            <div>
                <LoadingButton @click="createCost" />
            </div>

        </template>



    </CreateLayout>
</template>
