<script lang="ts" setup>

import SharedForm from '@/modules/shared/components/SharedForm.vue';
import { Breadcrumb } from 'primevue';

import { ref } from "vue";

const home = ref({
    label: 'Communities',
    route: '/communities'
});
const items = ref([
    { label: 'Create'},
]);

</script>

<template>
    <div class="py-6">

        <Breadcrumb :home="home" :model="items">
            <template #item="{ item, props }">
                <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                    <a :href="href" v-bind="props.action" @click="navigate">
                        <span :class="[item.icon, 'text-color']" />
                        <span class="text-primary font-semibold">{{ item.label }}</span>
                    </a>
                </router-link>
                <a v-else :href="item.url" :target="item.target" v-bind="props.action">
                    <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
                </a>
            </template>
        </Breadcrumb>

        <div>
            <h1 class="text-3xl pb-3">
                <slot name="view-title">
                    Page title
                </slot>
            </h1>
        </div>

    </div>

    <SharedForm>
        <template #inputs>
            <slot name="inputs"></slot>
        </template>
    </SharedForm>

</template>

<style lang="scss" scoped></style>