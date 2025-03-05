<template>

    <CreateLayout>


        <template #view-title>Create user</template>


        <template #inputs>

            <MyInputGroup input-type="input" label="Name" input-id="name" />
            <MyInputGroup input-type="input" label="Email" input-id="email" />
            <MyInputGroup input-type="input" label="Password" input-id="password" />
            <MyInputGroup input-type="select" label="Role" input-id="role" />
            <MyInputGroup input-type="input" label="Phone number" input-id="phone-number" />

            <div />

            <div>
                <Button>Create</Button>
            </div>

        </template>

    </CreateLayout>

</template>

<script setup lang="ts">

import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { Button } from 'primevue';


</script>
