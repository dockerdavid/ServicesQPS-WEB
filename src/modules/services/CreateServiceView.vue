<script lang="ts" setup>
import CreateLayout from '@/layouts/CreateLayout.vue';
import { Button, DatePicker, FloatLabel, IconField, InputIcon, InputText, Select, Textarea } from 'primevue';
</script>

<template>
    <CreateLayout>
        <template #view-title>
            Create service
        </template>

        <template #view-form>
            <form class="grid grid-cols-2 gap-6">
                <!--Left-->
                <fieldset>
                    <label for="date">Date</label>
                    <IconField>
                        <DatePicker id="date" class="w-full" />
                        <InputIcon class="pi pi-calendar" />
                    </IconField>

                    <label for="unit-size">Unit size</label>
                    <Select id="unit-size" class="w-full" />

                    <label for="community">Community</label>
                    <Select id="community" class="w-full" />
                
                    <label for="status">Status</label>
                    <Select id="status" class="w-full" />

                    <label for="cleaner">Cleaner</label>
                    <Select id="cleaner" class="w-full" />
                </fieldset>

                <!--Right-->
                <fieldset>
                    <label for="schedule">Schedule</label>
                    <IconField>
                        <DatePicker timeOnly hourFormat="12" id="schedule" class="w-full" />
                        <InputIcon class="pi pi-clock" />
                    </IconField>

                    <label for="unit-number">Unit number</label>
                    <IconField>
                        <InputText id="unit-number" class="w-full" />
                        <InputIcon class="pi pi-address-book" />
                    </IconField>

                    <label for="type">Type</label>
                    <Select id="type" class="w-full" />

                    <label for="extras">Extras</label>
                    <Select id="extras" class="w-full" />

                    <label for="comment">Comment</label>
                    <Textarea id="comment" style="resize:none;" class="w-full" />
                </fieldset>
            </form>

            <Button>Create</Button>

        </template>
    </CreateLayout>
</template>

<style lang="scss" scoped></style>
