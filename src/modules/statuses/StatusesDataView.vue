<script setup lang="ts">
import BaseLayout from '@/layouts/BaseLayout.vue';
import { InputIcon, Button, Card, Chip, Column, DataTable, IconField, InputText, Popover, InputGroupAddon, Breadcrumb } from 'primevue';
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
    <BaseLayout>
        <!-- Slot para el título -->
        <template #view-title>
            Statuses
        </template>

        <!-- Slot para el botón "Create new" -->
        <template #create-new>
            <Button>New status</Button>
        </template>

        <!-- Slot para el botón del header -->

        <!-- Slot para la búsqueda -->
        <template #header-search>
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText placeholder="Search" />
            </IconField>
        </template>

        <!-- Slot para el contenido del Card -->
        <template #card-content>
            <DataTable :value="customers" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                tableStyle="min-width: 50rem">
                <Column field="name" header="Name" style="width: 25%"></Column>
                <Column field="country.name" header="Country" style="width: 25%"></Column>
                <Column field="company" header="Company" style="width: 25%"></Column>
                <Column field="representative.name" header="Representative" style="width: 25%"></Column>
            </DataTable>
        </template>
    </BaseLayout>
</template>
