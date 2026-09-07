<template>
    <div class="p-4 h-[100vh]">
        <router-link class="text-2xl" :to="rutaDeRegreso">Go back</router-link>
        <div class="h-[90%] flex place-content-center">
            <img class="w-100" src="../../../../public/svgs/not-found.svg" alt="">
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import roleRoutes, { resolveRoleKey } from '../../../../src/router/role-routes';
import { useUserStore } from '../../../../src/store/user.store';

/**
 * El destino se arma por NOMBRE de ruta, no por texto plano: `:to="'x'"` lo
 * interpreta vue-router como una direccion, y el nombre no siempre coincide
 * con ella (`vendedor-comisiones` vive en `/vendedor`). Cuando no coincidia,
 * el enlace caia de nuevo en notFound y no habia forma de salir.
 *
 * Si el rol no se puede resolver se manda a la raiz, que redirige a donde
 * corresponda: mejor eso que un boton muerto en la unica pantalla de escape.
 */
const rutaDeRegreso = computed(() => {
    const userData = useUserStore().userData;
    const roleKey = resolveRoleKey(userData?.role?.name, userData?.roleId);
    const primera = roleKey ? roleRoutes[roleKey].find((name) => name !== 'notFound') : undefined;

    return primera ? { name: primera } : '/';
});
</script>

<style lang="scss" scoped></style>
