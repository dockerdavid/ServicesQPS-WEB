<script setup lang="ts">

import { CommunitiesServices } from './communities.services';
import { CompaniesServices } from '../companies/companies.services';
import { UsersServices } from '../users/users.services';
import type { NewCommunity } from '../../interfaces/communities/communities.interface';
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import MyMapPicker from '../shared/components/MyMapPicker.vue';

const breadcrumbRoutes = [
  { label: 'Comunidades', to: { name: 'communities-default' } },
  { label: 'Crear', to: { name: 'communities-create' } },
];

const inputs:InputConfig[] = [
  { inputId: 'communityName', label: 'Nombre de la comunidad', inputType: 'input',  },
  { inputId: 'managerUserId', label: 'Manager', inputType: 'select',  },
  { inputId: 'companyId', label: 'Compañía', inputType: 'select', },
  { inputId: 'vendorUserId', label: 'Vendedor asociado', inputType: 'select', required: false },
  { inputId: 'isActive', label: 'Comunidad activa', inputType: 'switch', required: false, defaultValue: true },
];

const loadOptions = async () => {
  // Los vendedores se piden aparte y filtrados por el API: el tope de `take`
  // es 150, asi que al pasar de 150 usuarios los mas nuevos quedaban fuera de
  // la pagina y el desplegable salia vacio.
  const [companies, managers, supervisors, vendedores] = await Promise.all([
    CompaniesServices.getCompanies(),
    UsersServices.getUsers(undefined, 150, false, true, '3'),
    UsersServices.getUsers(undefined, 150, false, true, '6'),
    UsersServices.getUsers(undefined, 150, false, true, '8'),
  ]);

  return {
    managerUserId: [...managers.data, ...supervisors.data]
      .map((user) => ({ label: user.name, value: user.id })),
    companyId: companies.data.map((company) => ({ label: company.companyName, value: company.id })),
    // Rol 8 = Vendedor asociado. Cobra comisión por los complex que trae.
    vendorUserId: vendedores.data.map((user) => ({ label: user.name, value: user.id })),
  };
};

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
  >
    <template #additional-fields="{ entityData }">
      <MyMapPicker
        v-model:latitude="entityData.latitude"
        v-model:longitude="entityData.longitude"
      />
    </template>
  </GenericCreateForm>
</template>
