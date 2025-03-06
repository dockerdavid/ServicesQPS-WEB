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
                <LoadingButton @click="createType" />
            </div>

        </template>

    </CreateLayout>

</template>

<script setup>
import { ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { useToast } from 'primevue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { TypesServices } from './types.services';
import { showToast } from '@/utils/show-toast';
import { NewType } from '@/interfaces/types/types.interface';

const toast = useToast();

const newType = ref<NewType>({

});

const createType = async() =>{

    try {
        await TypesServices.createType();
        showToast(toast, {severity: 'success', detail: 'Type was created'})
        newType.value = {

        }
    } catch (error) {
        showToast(toast, {severity: 'error', summary: "Type wasn't created"})
    }

}

</script>
