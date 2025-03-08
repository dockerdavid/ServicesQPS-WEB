<script setup lang="ts">

import GenericEditForm from '../shared/views/GenericEditForm.vue';
import { CompaniesServices } from './companies.services';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentCompanyId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Companies', to: { name: 'companies-default' } },
  { label: 'Edit', to: { name: 'companies-edit' } },
];

const inputs = [
  { label: 'Company name', inputId: 'companyName', inputType: 'input' },
];

const loadData = async (id: string) => {
  return await CompaniesServices.getCompanyById(id);
};

const updateEntity = async (id: string, data: any) => {
  await CompaniesServices.updateCompany(id, data);
};
</script>

<template>
  <GenericEditForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Edit Company"
    :inputs="inputs"
    :load-data="loadData"
    :update-entity="updateEntity"
    :initial-data="{ companyName: '' }"
  />
</template>