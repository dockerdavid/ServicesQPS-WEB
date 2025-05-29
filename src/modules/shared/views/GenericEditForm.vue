<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import CreateLayout from '../../../layouts/CreateLayout.vue';
import MyInputGroup from '../components/MyInputGroup.vue';
import LoadingButton from '../components/LoadingButton.vue';
import { useToast } from 'primevue';
import { showToast } from '../../../utils/show-toast';
import { useRoute } from 'vue-router';
import type { InputConfig } from '../../../interfaces/input-config.interface';



const props = defineProps({
  breadcrumbRoutes: {
    type: Array as () => Array<{ label: string; to: { name: string } }>,
    required: true,
  },
  viewTitle: {
    type: String,
    required: true,
  },
  inputs: {
    type: Array as () => InputConfig[],
    required: true,
  },
  loadData: {
    type: Function,
    required: true,
  },
  updateEntity: {
    type: Function,
    required: true,
  },
  initialData: {
    type: Object as () => Record<string, any>,
    required: true,
  },
  keyValueMap: {
    type: Object as () => Record<string, string>,
    default: () => ({}),
  },
});

const isFormSubmitted = ref(false);

const toast = useToast();
const route = useRoute();
const entityId = route.params.id as string;
const entityData = ref({ ...props.initialData });


const getNestedValue = (source: Record<string, any>, path: string) => {
  return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), source);
};


const fillInitialData = (source: Record<string, any>, target: Record<string, any>) => {
  props.inputs.forEach((input) => {
    if (input.inputType === 'select' || input.inputType === 'multiselect') {
      const sourceKey = props.keyValueMap[input.inputId] || input.inputId;
      target[input.inputId] = getNestedValue(source, sourceKey);
    } else {
      target[input.inputId] = source[input.inputId] || '';
    }
  });

  if (source.id) {
    target.id = source.id;
  }
};


const updateSelectOptions = (data: Record<string, any>) => {
  props.inputs.forEach((input) => {
    if (input.inputType === 'select' && data[input.inputId + 'Options']) {
      input.options = data[input.inputId + 'Options'];
    }
  });
};


watch(
  () => props.inputs,
  (newInputs) => {
    newInputs.forEach((input) => {
      if (input.inputType === 'select' && input.options) {

        if (entityData.value[input.inputId] && !input.options.some((option) => option.value === entityData.value[input.inputId])) {
          entityData.value[input.inputId] = '';
        }
      }
    });
  },
  { deep: true }
);

const updateEntity = async () => {

  isFormSubmitted.value = true;

  const errors = props.inputs
    .filter((input) => {
  
      if (input.required === undefined || true) {

        const value = entityData.value[input.inputId];

        if (input.inputType === 'input') {
          return !value || value.toString().trim() === '';
        }
        if (input.inputType === 'numeric') {
          return value === null || value === undefined || value.toString().trim() === '';
        }

      }
      return false;
    })
    .map((input) => input.label);

  if (errors.length > 0) {
    showToast(toast, {
      severity: 'error',
      summary: 'Campos requeridos',
      detail: `Los siguientes campos son obligatorios: ${errors.join(', ')}`,
    });
    return;
  }

  try {


    const dataToUpdate = Object.keys(entityData.value).reduce((acc, key) => {

      const inputConfig = props.inputs.find(input => input.inputId === key);
      if (inputConfig?.isNotNeccesary && entityData.value[key] === '') {
        return acc;
      }
      acc[key] = entityData.value[key];
      return acc;
    }, {} as Record<string, any>);


    props.inputs.forEach((input) => {
      if (input.inputType === 'numeric' && typeof dataToUpdate[input.inputId] === 'string') {
        dataToUpdate[input.inputId] = parseFloat(dataToUpdate[input.inputId]);
      }
    });

    await props.updateEntity(entityId, dataToUpdate);
    showToast(toast, { severity: 'success', summary: 'Entity updated', detail: `Entity ${entityId}` });



  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Entity wasn't updated", detail: `Entity ${entityId}` });
  } finally {
    isFormSubmitted.value = false;
  }
};

onMounted(async () => {
  const data = await props.loadData(entityId);


  updateSelectOptions(data);


  fillInitialData(data, entityData.value);
});
</script>

<template>
  <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>{{ viewTitle }}</template>

    <template #inputs>
      <MyInputGroup v-for="input in inputs" :key="input.inputId" v-model="entityData[input.inputId]"
        :required="input.required" :label="input.label" :inputId="input.inputId" :input-type="input.inputType"
        :options="input.options" :input-numeric-mode="input.inputNumericMode" :time-only="input.timeOnly"
        :hour-format="input.hourFormat" :is-form-submitted="isFormSubmitted" />

      <slot name="additional-fields"></slot>

      <div v-if="inputs.length % 2 !== 0"></div>

      <div>
        <LoadingButton label="Edit" @click="updateEntity"></LoadingButton>
      </div>
    </template>
  </CreateLayout>
</template>