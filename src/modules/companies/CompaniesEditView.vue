<script setup lang="ts">
import { ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { useToast } from 'primevue';
import { CompaniesServices } from './companies.services';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { showToast } from '@/utils/show-toast';

const companyName = ref('');
const toast = useToast();

const breadcrumbRoutes = [
    { label: 'Companies', to: { name: 'companies-default' } },
    { label: 'Edit', to: { name: 'companies-edit' } },
];

const createCompany = async () => {

    try {
        await CompaniesServices.createCompany(companyName.value);
        showToast(toast, { severity: 'success', summary: 'Company updated' })
        companyName.value = '';
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Company wasn't updated" })
    }

}

</script>

<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title> Edit Company </template>

        <template #inputs>

            <MyInputGroup v-model="companyName" label="Company name" inputId="name" input-type="input" />

            <div />

            <div>
                <LoadingButton @click="createCompany"></LoadingButton>
            </div>

        </template>



    </CreateLayout>
</template>
