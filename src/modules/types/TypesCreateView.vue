<template>

    <CreateLayout>

        <template #view-title>Create Type</template>

        <template #inputs>

            <MyInputGroup v-model="newType.description" label="Description" input-id="description" input-type="input" />
            <MyInputGroup v-model="newType.cleaningType" label="Cleaning type" input-id="cleaning-type" input-type="input" />
            <MyInputGroup v-model="newType.price" label="Price" input-id="price" input-type="numeric" />
            <MyInputGroup v-model="newType.communityId" :options="communitiesOptions" label="Community" input-id="community" input-type="select" />
            <MyInputGroup  v-model="newType.commission" label="Commision" input-id="commision" input-type="numeric" />

            <div />

            <div>
                <LoadingButton @click="createType" />
            </div>

        </template>

    </CreateLayout>

</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue';
import CreateLayout from '@/layouts/CreateLayout.vue';

import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';

import { TypesServices } from './types.services';

import type { NewType } from '@/interfaces/types/types.interface';

import { showToast } from '@/utils/show-toast';
import { CommunitiesServices } from '../communities/communities.services';
import type { Communities } from '@/interfaces/communities/communities.interface';
import genericNullObject from '@/utils/null-data-meta';

const toast = useToast();

const communities = ref<Communities>(genericNullObject)
const communitiesOptions = computed(() => {
    return communities.value.data.map((community)=>{
        return {
            label: community.communityName,
            value: community.id
        }
    })
})

const newType = ref<NewType>({
    cleaningType: '',
    commission: '',
    communityId: '',
    description: '',
    price: 0
});

const createType = async () => {

    try {
        newType.value.commission = newType.value.commission.toString()
        await TypesServices.createType(newType.value);
        showToast(toast, { severity: 'success', detail: 'Type was created' })
        newType.value = {
            cleaningType: '',
            commission: '',
            communityId: '',
            description: '',
            price: 0
        }
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Type wasn't created" })
    }

}

onMounted(async () => {

    communities.value = await CommunitiesServices.getCommunities();


})

</script>
