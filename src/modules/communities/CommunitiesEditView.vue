<script setup lang="ts">

import CreateLayout from '@/layouts/CreateLayout.vue';
import { computed, onMounted, ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { CommunitiesServices } from './communities.services';
import type { Community, NewCommunity } from '@/interfaces/communities/communities.interface';
import { CompaniesServices } from '../companies/companies.services';
import type { Companies } from '@/interfaces/companies/companies.interface';
import genericNullObject from '@/utils/null-data-meta';
import type { Users } from '@/interfaces/users/users.interface';
import { UsersServices } from '../users/users.services';
import { useToast } from 'primevue';
import { showToast } from '@/utils/show-toast';
import { useRoute } from 'vue-router';

const toast = useToast();

const route = useRoute();
const currentCommunityId = route.params.id as string;

const currentCommunity = ref<Community>();
const companies = ref<Companies>(genericNullObject);
const companiesOptions = computed(() => {
    return companies.value.data.map((company) => {
        return {
            label: company.companyName,
            value: company.id
        };
    });
})

const users = ref<Users>(genericNullObject);
const usersOptions = computed(() => {
    return users.value.data.map((user) => {
        return {
            label: user.name,
            value: user.id
        }
    })
})

const newCommunity = ref<NewCommunity>({
    communityName: '',
    companyId: '',
    userId: '',
    id: ''
});

const updateCommunity = async () => {

    if (!currentCommunity.value?.id!) return
    try {
        await CommunitiesServices.updateCommunity(currentCommunity.value!.id, newCommunity.value);

        showToast(toast, { severity: 'success', summary: 'Community updated' })
    } catch (error) {
        showToast(toast, { severity: 'error', summary: "Community wasn't updated" })
    }
}

const breadcrumbRoutes = [
    { label: 'Communities', to: { name: 'communities-default' } },
    { label: 'Edit', to: { name: 'communities-edit' } },
];



onMounted(async () => {
    const [companiesResult, usersResult, communityResult] = await Promise.all([
        CompaniesServices.getCompanies(),
        UsersServices.getUsers(undefined, 50),
        CommunitiesServices.getCommunityById(currentCommunityId)
    ]);

    companies.value = companiesResult;
    users.value = usersResult;
    currentCommunity.value = communityResult;


    if (currentCommunity.value) {
        newCommunity.value = {
            communityName: currentCommunity.value.communityName || '',
            companyId: currentCommunity.value.company?.id || '',
            userId: currentCommunity.value.user?.id || '',
            id: currentCommunity.value.id || ''
        };
    }

});

</script>

<template>
    <CreateLayout :breadcrumb-routes="breadcrumbRoutes">

        <template #view-title> Edit Community </template>

        <template #inputs>

            <MyInputGroup v-model="newCommunity.communityName" label="Community name" inputId="name"
                input-type="input" />
            <MyInputGroup :options="usersOptions" v-model="newCommunity.userId" label="Manager" inputId="manager"
                input-type="select" />
            <MyInputGroup :options="companiesOptions" v-model="newCommunity.companyId" label="Company" inputId="company"
                input-type="select" />

            <div />

            <div>
                <LoadingButton label="Create" @click="updateCommunity"></LoadingButton>
            </div>

        </template>

    </CreateLayout>
</template>
