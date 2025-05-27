<script setup lang="ts">

import { CompaniesServices } from './companies.services';
<<<<<<< HEAD
import { useToast } from 'primevue';
import { showToast } from '../../utils/show-toast';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import type { InputConfig } from 'src/interfaces/input-config.interface';

// Configuración del breadcrumb
=======
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import type { InputConfig } from 'src/interfaces/input-config.interface';

>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
const breadcrumbRoutes = [
  { label: 'Companies', to: { name: 'companies-default' } },
  { label: 'Create', to: { name: 'companies-create' } },
];

<<<<<<< HEAD
// Configuración de los campos del formulario
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
const inputs:InputConfig[] = [
  { inputId: 'companyName', label: 'Company name', inputType: 'input'},
];

<<<<<<< HEAD
// Función para crear la entidad
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
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