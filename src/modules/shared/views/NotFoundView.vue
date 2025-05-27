<template>
    <div class="p-4 h-[100vh]">
        <router-link class="text-2xl" :to="roleRoutes[userRole][0]">Go back</router-link>
        <div class="h-[90%] flex place-content-center">
            <img class="w-100" src="../../../../public/svgs/not-found.svg" alt="">
        </div>

    </div>
</template>

<script setup lang="ts">

import roleRoutes from '../../../../src/router/role-routes';
import { useUserStore } from '../../../../src/store/user.store';

const userRole = useUserStore().userData?.role.name.toLowerCase() as keyof typeof roleRoutes;


</script>

<style lang="scss" scoped></style>