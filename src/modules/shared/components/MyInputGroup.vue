<template>
    <fieldset>
        <label :for="props.inputId">{{ props.label }} <span class="text-red-500">{{ props.required ? '*' : '' }}</span>
        </label>
        <IconField>
            <InputText :aria-required="true" :placeholder="props.placeholder" v-if="props.inputType === 'input'"
                v-model="modelValue" :required="props.required" :id="props.inputId" />

            <Password :placeholder="props.placeholder" v-if="props.inputType === 'password'"
                v-model="modelValue" :required="props.required" :id="props.inputId" :feedback="false" toggleMask
                class="w-full" />

            <DatePicker :placeholder="props.placeholder" v-if="props.inputType === 'datepicker'" v-model="dateValue"
                :required="props.required" :aria-required="props.required" :inputId="props.inputId"
                :hourFormat="props.hourFormat ? '12' : '24'" :timeOnly="props.timeOnly" />

            <Select :placeholder="props.placeholder" v-if="props.inputType === 'select'" v-model="modelValue"
                :required="props.required" :aria-required="props.required" :labelId="props.inputId"
                :options="props.options" option-label="label" option-value="value" />

            <InputNumber :required="props.required" :aria-required="props.required" :useGrouping="false"
                :placeholder="props.placeholder" :mode="props.inputNumericMode" currency="USD"
                v-if="props.inputType === 'numeric'" v-model="numericValue" :inputId="props.inputId" />

            <Textarea :placeholder="props.placeholder" v-if="props.inputType === 'textarea'"
                v-model="modelValue" :required="props.required" :aria-required="props.required" :id="props.inputId"
                :rows="props.rows" :auto-resize="props.autoResize" :max-height="props.maxHeight" class="w-full" />

            <MultiSelect v-if="props.inputType === 'multiselect'" v-model="modelValue" :options="props.options"
                optionLabel="label" optionValue="value" :placeholder="props.placeholder" :filter="true"
                :maxSelectedLabels="3" class="w-full md:w-80" />

            <InputIcon :placeholder="props.placeholder" v-if="props.inputType !== 'select' && props.icon"
                :class="`pi pi-${props.icon}`" />
        </IconField>
        <small v-if="props.required && props.isFormSubmitted && !modelValue" class="text-red-500">Field required</small>
    </fieldset>
</template>

<script lang="ts" setup>
import { DatePicker, IconField, InputIcon, InputText, Select, InputNumber, Password, Textarea } from 'primevue';
import moment from 'moment';
import { computed } from 'vue';
import type { InputNumericMode, InputType } from '../../../interfaces/input-config.interface';


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
    required?: boolean;
    isFormSubmitted: boolean;
    rows?: number;
    autoResize?: boolean;
    maxHeight?: string;
}


const props = withDefaults(defineProps<InputGroupProps>(), {
    inputNumericMode: 'currency',
    required: true,
    rows: 3,
    autoResize: true,
    maxHeight: '200px',
});


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
