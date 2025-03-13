<script setup lang="ts">

import { CommunitiesServices } from './communities.services';
import { CompaniesServices } from '../companies/companies.services';
import { UsersServices } from '../users/users.services';
import type { NewCommunity } from '../../interfaces/communities/communities.interface';
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';

// Configuración del breadcrumb
const breadcrumbRoutes = [
  { label: 'Comunidades', to: { name: 'communities-default' } },
  { label: 'Crear', to: { name: 'communities-create' } },
];

// Configuración de los campos del formulario
const inputs:InputConfig[] = [
  { inputId: 'communityName', label: 'Nombre de la comunidad', inputType: 'input',  },
  { inputId: 'userId', label: 'Manager', inputType: 'select',  },
  { inputId: 'companyId', label: 'Compañía', inputType: 'select', },
];

// Función para cargar opciones de selects
const loadOptions = async () => {
  const [companies, users] = await Promise.all([
    CompaniesServices.getCompanies(),
    UsersServices.getUsers(undefined, 50),
  ]);

  return {
    userId: users.data.map((user) => ({ label: user.name, value: user.id })),
    companyId: companies.data.map((company) => ({ label: company.companyName, value: company.id })),
  };
};

// Función para crear la entidad
const createEntity = async (data: NewCommunity) => {
  await CommunitiesServices.createCommunity(data);
};
</script>

<template>
  <GenericCreateForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Crear Comunidad"
    :inputs="inputs"
    :create-entity="createEntity"
    :load-options="loadOptions"
  />
</template>