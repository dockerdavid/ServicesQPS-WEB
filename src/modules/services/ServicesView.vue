<script setup lang="ts">
import BaseLayout from '@/layouts/BaseLayout.vue';
import { Button, Card, Chip, Column, DataTable, IconField, InputText, Popover, InputGroupAddon, Breadcrumb } from 'primevue';
import { ref } from "vue";

const customers: any = [
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
    {
        name: 'Name',
        country: {
            name: 'Name country'
        },
        company: "Company",
        representative: {
            name: 'Name representative'
        }
    },
]

const op = ref();

const toggle = (event: any) => {
    op.value.toggle(event);
}

</script>


<template>
    <RouterView />
</template>
