<template>

    <CreateLayout>

        <template #view-title>Create Status</template>

        <template #inputs>

            <MyInputGroup input-type="input" input-id="name" label="Status name" />

            <div />

            <div>
                <Button>
                    Create
                </Button>
            </div>

        </template>

    </CreateLayout>

</template>

<script setup lang="ts">
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import { BaseComponent } from '@fullcalendar/core/internal';
import { Button } from 'primevue';


</script>
