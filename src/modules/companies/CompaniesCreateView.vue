<script setup lang="ts">

import { CompaniesServices } from './companies.services';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import type { InputConfig } from 'src/interfaces/input-config.interface';

const breadcrumbRoutes = [
  { label: 'Companies', to: { name: 'companies-default' } },
  { label: 'Create', to: { name: 'companies-create' } },
];

const inputs:InputConfig[] = [
  { inputId: 'companyName', label: 'Company name', inputType: 'input'},
];

const createEntity = async (data: { companyName: string }) => {
    await CompaniesServices.createCompany(data.companyName);
};


</script>

<template>
  <GenericCreateForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Create Company"
    :inputs="inputs"
    :create-entity="createEntity"
  />
</template>