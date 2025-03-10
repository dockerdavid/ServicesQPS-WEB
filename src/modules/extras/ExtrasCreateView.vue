<script lang="ts" setup>
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';

import { ExtrasServices } from './extras.services';
import type { NewExtra } from 'src/interfaces/extras/extras.interface';


const breadcrumbRoutes = [
  { label: 'Extras', to: { name: 'extras-default' } },
  { label: 'Create', to: { name: 'extras-create' } },
];

const inputs: InputConfig[] = [
    { label: 'Item', inputId: 'item', inputType: 'input' },
    { label: 'Item price', inputId: 'itemPrice', inputType: "numeric" },
    { label: 'Commission', inputId: 'commission', inputType: "numeric"}
]

const createEntity = async (newExtra: NewExtra) => {
    await ExtrasServices.createExtra(newExtra)
}

</script>


<template>
    <GenericCreateForm
        :breadcrumb-routes="breadcrumbRoutes"
         view-title="Create extra" 
        :inputs="inputs"
        :create-entity="createEntity"
        
        />
</template>