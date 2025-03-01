<script lang="ts" setup>
import { Breadcrumb } from 'primevue'
</script>


<template>

    <div class="py-6">
        <Breadcrumb :model="[{ label: 'page' }, { label: 'page/page' }]" />
        <div>
            <h1 class="text-3xl pb-3">
                <slot name="view-title">
                    Page title
                </slot>
            </h1>

        </div>
    </div>


    <slot name="view-form">

    </slot>

</template>


<style lang="scss" scoped></style>