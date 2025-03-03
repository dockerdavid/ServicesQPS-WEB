<template>

    <fieldset>
        <label :for="props.inputId">{{ props.label }}</label>
        <IconField>

            <InputText v-if="props.inputType === 'input'" v-model="modelValue" :id="props.inputId" />

            <DatePicker v-if="props.inputType === 'datepicker'" v-model="dateValue" :inputId="props.inputId"
                :hourFormat="props.hourFormat ? '12' : '24'" :timeOnly="props.timeOnly" />

            <Select v-if="props.inputType === 'select'" v-model="modelValue" 
                :labelId="props.inputId" :options="props.options" />

            <InputIcon v-if="props.inputType !== 'select'"
                :class="props.icon ? `pi pi-${props.icon}` : 'pi pi-circle'" />

        </IconField>
    </fieldset>




</template>

<script lang="ts" setup>
import { DatePicker, IconField, InputIcon, InputText, Select } from 'primevue';
import moment from 'moment';
import { computed } from 'vue';

type InputType = 'input' | 'select' | 'datepicker';

interface InputGroupProps {
    inputType: InputType;
    icon?: string;
    hourFormat?: boolean;
    timeOnly?: boolean;
    label: string;
    inputId: string;
    options?: Array<{ label: string; value: string }>;
}

const props = defineProps<InputGroupProps>();

const model = defineModel<string>();

const dateValue = computed({
    get() {

        return model.value && moment(model.value, 'YYYY-MM-DD', true).isValid()
            ? moment(model.value).toDate()
            : null;
    },
    set(value: Date | null) {
        model.value = value ? moment(value).format('YYYY-MM-DD') : '';
    },
});

const modelValue = computed({
    get() {
        return model.value || '';
    },
    set(value: string) {
        model.value = value;
    },
});

</script>

<style lang="scss" scoped></style>