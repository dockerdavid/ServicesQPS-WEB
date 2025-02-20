<script setup lang="ts">
import { Button, Card, Chip, Column, DataTable, Popover } from 'primevue';
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
    <div>

        <h1>Dashboard</h1>

        <Card>

            <template #subtitle>
                <div class="d-flex align-center justify-between py-2 flex-wrap">
                    <span>Service report</span>
                    <div>
                        <Button>Export General Reports</Button>
                        <Button class="mx-2">Export Cleaner Reports</Button>
                        <Button>Invoices</Button>
                    </div>
                </div>

            </template>

            <template #content>

                <!--FILTER-->

                <div class="d-flex justify-between py-2 align-center border-vertical">

                    <div class="d-flex justify-end w-100 mx-2">
                        <Chip class="ml-2" label="Filtro uno" removable />
                        <Chip class="ml-2" label="Filtro dos" removable />
                        <Chip class="ml-2" label="Filtro tres" removable />
                    </div>

                    <Button class="button-unstyled" type="button" unstyled @click="toggle">
                        <Icon icon="ph:seal-question-fill" />
                    </Button>

                    <Popover ref="op">
                        <div>Popover working</div>
                    </Popover>
                </div>


                <div>
                    <DataTable :value="customers" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
                        tableStyle="min-width: 50rem">
                        <Column field="name" header="Name" style="width: 25%"></Column>
                        <Column field="country.name" header="Country" style="width: 25%"></Column>
                        <Column field="company" header="Company" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                        <Column field="representative.name" header="Representative" style="width: 25%"></Column>
                    </DataTable>
                </div>


            </template>

        </Card>

    </div>

</template>



<style lang="scss" scoped>
.button-unstyled{
    background: none;
    border: none;
}
</style>