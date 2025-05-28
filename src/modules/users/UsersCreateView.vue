<script lang="ts" setup>
import type { InputConfig } from 'src/interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';

import type { NewType } from 'src/interfaces/types/types.interface';
import { CommunitiesServices } from '../communities/communities.services';
import type { NewUser } from 'src/interfaces/users/users.interface';
import { UsersServices } from './users.services';



const breadcrumbRoutes = [
    { label: 'Types', to: { name: 'types-default' } },
    { label: 'Create', to: { name: 'types-create' } },
];

const inputs: InputConfig[] = [
    { label: 'Name', inputId: 'name', inputType: 'input' },
    { label: 'Email', inputId: 'email', inputType: 'input' },
    { label: 'Password', inputId: 'password', inputType: 'input' },
    { label: 'Role', inputId: 'roleId', inputType: 'select' },
    { label: 'Phone number', inputId: 'phoneNumber', inputType: 'numeric', inputNumericMode: 'decimal' },
]

const loadOptions = async () => {

    const data = await UsersServices.getUsersRoles();
    return {
        roleId: data.map((rol) => { return { label: rol.name, value: rol.id } })
    }
};

const createEntity = async (newUser: NewUser) => {

    newUser.phoneNumber = `+1${newUser.phoneNumber.toString()}`

    await UsersServices.createUser(newUser)
}

</script>


<template>
    <GenericCreateForm :breadcrumb-routes="breadcrumbRoutes" view-title="Create type" :inputs="inputs"
        :create-entity="createEntity" :load-options="loadOptions" />
</template>