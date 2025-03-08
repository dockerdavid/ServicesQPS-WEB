<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from './communities.services';
import { UsersServices } from '../users/users.services';
import { CompaniesServices } from '../companies/companies.services';
import GenericEditForm from '../shared/views/GenericEditForm.vue';

const route = useRoute();
const currentCommunityId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Communities', to: { name: 'communities-default' } },
  { label: 'Edit', to: { name: 'communities-edit' } },
];

const inputs = [
  { label: 'Community name', inputId: 'communityName', inputType: 'input' },
  { label: 'Manager', inputId: 'userId', inputType: 'select', options: [] },
  { label: 'Company', inputId: 'companyId', inputType: 'select', options: [] },
];

const keyValueMap = {
  userId: 'user.id', // Mapea userId a user.id
  companyId: 'company.id', // Mapea companyId a company.id
};

const loadData = async (id: string) => {
  const [companiesResult, usersResult, communityResult] = await Promise.all([
    CompaniesServices.getCompanies(),
    UsersServices.getUsers(undefined, 50),
    CommunitiesServices.getCommunityById(id),
  ]);

  return {
    ...communityResult, // Datos de la comunidad
    userIdOptions: usersResult.data.map((user) => ({
      label: user.name,
      value: user.id,
    })),
    companyIdOptions: companiesResult.data.map((company) => ({
      label: company.companyName,
      value: company.id,
    })),
  };
};

const updateEntity = async (id: string, data: any) => {
  await CommunitiesServices.updateCommunity(id, data);
};
</script>

<template>
  <GenericEditForm
    :breadcrumb-routes="breadcrumbRoutes"
    view-title="Edit Community"
    :inputs="inputs"
    :load-data="loadData"
    :update-entity="updateEntity"
    :initial-data="{ communityName: '', userId: '', companyId: '' }" 
    :key-value-map="keyValueMap"
  />
</template>