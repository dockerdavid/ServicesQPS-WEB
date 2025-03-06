<template>
    <fieldset>
        <label :for="props.inputId">{{ props.label }}</label>
        <IconField>
            <InputText :placeholder="props.placeholder" v-if="props.inputType === 'input'" v-model="modelValue"
                :id="props.inputId" />

            <DatePicker :placeholder="props.placeholder" v-if="props.inputType === 'datepicker'" v-model="dateValue"
                :inputId="props.inputId" :hourFormat="props.hourFormat ? '12' : '24'" :timeOnly="props.timeOnly" />

            <Select :placeholder="props.placeholder" v-if="props.inputType === 'select'" v-model="modelValue"
                :labelId="props.inputId" :options="props.options" option-label="label" option-value="value" />

            <InputNumber :useGrouping="false" :placeholder="props.placeholder" :mode="props.inputNumericMode" currency="USD"
                v-if="props.inputType === 'numeric'" v-model="numericValue" :inputId="props.inputId" />

            <InputIcon :placeholder="props.placeholder" v-if="props.inputType !== 'select' && props.icon"
                :class="`pi pi-${props.icon}`" />
        </IconField>
    </fieldset>
</template>

<script lang="ts" setup>
import { DatePicker, IconField, InputIcon, InputText, Select, InputNumber } from 'primevue';
import moment from 'moment';
import { computed } from 'vue';

type InputType = 'input' | 'select' | 'datepicker' | "numeric";
type InputNumericMode = 'currency' | 'decimal';

interface InputGroupProps {
    label: string;
    inputType: InputType;
    inputId: string;
    placeholder?: string;
    hourFormat?: boolean;
    icon?: string;
    timeOnly?: boolean;
    options?: Array<{ label: string; value: string }>;
    inputNumericMode?: InputNumericMode;
}

const props = withDefaults(defineProps<InputGroupProps>(),
    { inputNumericMode: 'currency' }
);


const model = defineModel<string | number | undefined>();

const modelValue = computed({
    get() {
        return typeof model.value === 'string' ? model.value : '';
    },
    set(value: string) {
        model.value = value;
    },
});

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

const numericValue = computed({
    get() {
        if (typeof model.value === 'number') {
            return model.value;
        }
        return model.value && !isNaN(Number(model.value)) ? Number(model.value) : null;
    },
    set(value: number | null) {

        model.value = value !== null ? value : undefined;
    },
});
</script>
