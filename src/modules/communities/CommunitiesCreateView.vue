<template>
    <CreateLayout>

        <template #view-title> Create Community </template>

        <template #inputs>

            <MyInputGroup v-model="newCommunity.communityName" label="Community name" inputId="name"
                input-type="input" />
            <MyInputGroup :options="usersOptions" v-model="newCommunity.userId" label="Manager" inputId="manager"
                input-type="select" />
            <MyInputGroup :options="companiesOptions" v-model="newCommunity.companyId" label="Company" inputId="company"
                input-type="select" />

            <div />

            <div>
                <LoadingButton label="Create" @click="createCommunity"></LoadingButton>
            </div>

        </template>

    </CreateLayout>
</template>

<script setup lang="ts">

import CreateLayout from '@/layouts/CreateLayout.vue';
import { computed, onMounted, ref } from 'vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { CommunitiesServices } from './communities.services';
import type { NewCommunity } from '@/interfaces/communities/communities.interface';
import { CompaniesServices } from '../companies/companies.services';
import type { Companies } from '@/interfaces/companies/companies.interface';
import genericNullObject from '@/utils/null-data-meta';
import type { Users } from '@/interfaces/users/users.interface';
import { UsersServices } from '../users/users.services';
import { useToast } from 'primevue';

const toast = useToast();

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
    userId: ''
})

const createCommunity = async () => {
    try {
        await CommunitiesServices.createCommunity(newCommunity.value);
        newCommunity.value = {
            communityName: '',
            companyId: '',
            userId: ''
        }
        toast.add({ severity: 'success', life: 3000, summary: 'Community created' })
    } catch (error) {

    }
}


onMounted(async () => {
    const [companiesResult, usersResult] = await Promise.all([
        CompaniesServices.getCompanies(),
        UsersServices.getUsers()
    ]);
    companies.value = companiesResult;
    users.value = usersResult;
});

</script>

<style lang="scss" scoped></style>