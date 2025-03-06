<template>
    <CreateLayout>

        <template #view-title> Create Company </template>

        <template #inputs>

            <MyInputGroup v-model="companyName" label="Company name" inputId="name" input-type="input" />

            <div />

            <div>
                <LoadingButton @click="createCompany"></LoadingButton>
            </div>

        </template>



    </CreateLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { Button, useToast } from 'primevue';
import { CompaniesServices } from './companies.services';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { showToast } from '@/utils/show-toast';

const companyName = ref('');
const toast = useToast();

const createCompany = async () => {

    try {
        await CompaniesServices.createCompany(companyName.value);
        showToast(toast, { severity: 'success', summary: 'Community created' })
        companyName.value = '';
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Community wasn't created" })
    }

}

</script>
