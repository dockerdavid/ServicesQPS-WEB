<script lang="ts" setup>
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import { TypesServices } from './types.services';
import type { NewType } from 'src/interfaces/types/types.interface';
import { CommunitiesServices } from '../communities/communities.services';
import type { Community } from 'src/interfaces/communities/communities.interface';



const breadcrumbRoutes = [
    { label: 'Types', to: { name: 'types-default' } },
    { label: 'Create', to: { name: 'types-create' } },
];

const inputs: InputConfig[] = [
    { label: 'Description', inputId: 'description', inputType: 'input' },
    { label: 'Cleaning type', inputId: 'cleaningType', inputType: 'input' },
    { label: 'Price', inputId: 'price', inputType: 'numeric' },
    { label: 'Community', inputId: 'communityId', inputType: 'select' },
    { label: 'Commission', inputId: 'commission', inputType: 'numeric' },
]

const loadOptions = async () => {
    let allCommunities: Community[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
        const { data, meta } = await CommunitiesServices.getCommunities(currentPage, 50);
        allCommunities = [...allCommunities, ...data];
        hasNextPage = meta.hasNextPage;
        currentPage++;
    }

    return {
        communityId: allCommunities.map((community) => { 
            return { 
                label: community.communityName, 
                value: community.id 
            } 
        })
    }
};

const createEntity = async (newType: NewType) => {
    if (newType.commission) {
        newType.commission = newType.commission.toString()
    }

    await TypesServices.createType(newType)
}

</script>


<template>
    <GenericCreateForm :breadcrumb-routes="breadcrumbRoutes" view-title="Create type" :inputs="inputs"
        :create-entity="createEntity" :load-options="loadOptions" />
</template>