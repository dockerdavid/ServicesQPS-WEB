<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { useToast } from 'primevue';
import { CompaniesServices } from './companies.services';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { showToast } from '@/utils/show-toast';
import { useRoute } from 'vue-router';
import type { UpdateCompany } from '@/interfaces/companies/companies.interface';

const toast = useToast();
const route = useRoute();
const currentCompanyId = route.params.id as string;
const currentCompany = ref();

const updatedCompany = ref<UpdateCompany>(
    { companyName: '', id: '' }
);


const breadcrumbRoutes = [
    { label: 'Companies', to: { name: 'companies-default' } },
    { label: 'Edit', to: { name: 'companies-edit' } },
];

const updateCompany = async () => {

    if (!currentCompany.value?.id) return;

    try {
        await CompaniesServices.updateCompany(currentCompany.value.id, updatedCompany.value);
        showToast(toast, { severity: 'success', summary: 'Company updated' });
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Company wasn't updated" });
    }
};

onMounted(async () => {

    const companyResult = await CompaniesServices.getCompanyById(currentCompanyId);
    currentCompany.value = companyResult;

    if (currentCompany.value) {
        updatedCompany.value = {
            companyName: currentCompany.value.companyName,
            id: currentCompany.value.id || ''
        }
    }
});
</script>

<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title> Edit Company </template>

        <template #inputs>

            <MyInputGroup v-model="updatedCompany.companyName" label="Company name" inputId="name" input-type="input" />

            <div />

            <div>
                <LoadingButton @click="updateCompany"></LoadingButton>
            </div>

        </template>



    </CreateLayout>
</template>
