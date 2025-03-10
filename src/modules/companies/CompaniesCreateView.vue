<script setup lang="ts">

import { CompaniesServices } from './companies.services';
import { useToast } from 'primevue';
import { showToast } from '../../utils/show-toast';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import type { InputConfig } from 'src/interfaces/input-config.interface';

// Configuración del breadcrumb
const breadcrumbRoutes = [
  { label: 'Companies', to: { name: 'companies-default' } },
  { label: 'Create', to: { name: 'companies-create' } },
];

// Configuración de los campos del formulario
const inputs:InputConfig[] = [
  { inputId: 'companyName', label: 'Company name', inputType: 'input'},
];

// Función para crear la entidad
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