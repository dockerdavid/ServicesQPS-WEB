<script setup lang="ts">
import { useRoute } from 'vue-router';
import { TypesServices } from './types.services';
import { CommunitiesServices } from '../communities/communities.services';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import type { NewType, Type, Community } from '../../interfaces/types/types.interface';
import type { InputConfig } from '../../interfaces/input-config.interface';

const route = useRoute();
const currentTypeId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Types', to: { name: 'types-default' } },
  { label: 'Edit', to: { name: 'types-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Description', inputId: 'description', inputType: 'input' },
  { label: 'Cleaning type', inputId: 'cleaningType', inputType: 'input' },
  { label: 'Price', inputId: 'price', inputType: 'numeric' },
  { label: 'Commission', inputId: 'commission', inputType: 'numeric' },
  { label: 'Community', inputId: 'communityId', inputType: 'select', options: [] },
];

const keyValueMap = {
<<<<<<< HEAD
  communityId: 'community.id', // Mapea communityId a community.id
=======
  communityId: 'community.id', 
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
};

const loadData = async (id: string) => {
  const [communitiesResult, typeResult] = await Promise.all([
    CommunitiesServices.getCommunities(),
    TypesServices.getTypeById(id),
  ]);

  return {
    ...typeResult, 
    communityIdOptions: communitiesResult.data.map((type: Community) => ({
      label: type.communityName,
      value: type.id,
    })),
  };
};

const updateEntity = async (id: string, data: NewType) => {
  data.commission = data.commission.toString();
  await TypesServices.updateType(id, data);
};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit Type" :inputs="inputs" :load-data="loadData"
    :update-entity="updateEntity" :initial-data="{
      description: '',
      cleaningType: '',
      price: 0,
      commission: '',
      communityId: '',
    }" :key-value-map="keyValueMap" />
</template>