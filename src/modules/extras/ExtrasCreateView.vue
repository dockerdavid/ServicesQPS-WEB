<script setup lang="ts">
import { ref } from 'vue';
import type { NewExtra } from '../../interfaces/extras/extras.interface';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '../../layouts/CreateLayout.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { showToast } from '../../utils/show-toast';
import { useToast } from 'primevue';
import { ExtrasServices } from './extras.services';

const toast = useToast();

const breadcrumbRoutes = [
    { label: 'Extras', to: { name: 'extras-default' } },
    { label: 'Create', to: { name: 'extras-create' } },
];

const newExtra = ref<NewExtra>({
    commission: 0,
    item: '',
    itemPrice: 0
})

const createNewExtra = async () => {
    try {
        await ExtrasServices.createExtra(newExtra.value);
        showToast(toast, { severity: 'success', summary: 'Extra was created' })
        newExtra.value = {
            commission: 0,
            item: '',
            itemPrice: 0
        }
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Extra wasn't created" })
    }
}

</script>

<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title> Create Extra </template>

        <template #inputs>

            <MyInputGroup v-model="newExtra.item" label="Item" inputId="item" input-type="input" />
            <MyInputGroup v-model="newExtra.itemPrice" placeholder="$0.00" label="Item price" inputId="item-price"
                input-type="numeric" />
            <MyInputGroup v-model="newExtra.commission" placeholder="$0.00" label="Comission" inputId="commision"
                input-type="numeric" />

            <div />

            <div>
                <LoadingButton @click="createNewExtra" />
            </div>

        </template>



    </CreateLayout>
</template>
