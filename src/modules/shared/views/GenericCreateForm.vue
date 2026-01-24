<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CreateLayout from '../../../layouts/CreateLayout.vue';
import MyInputGroup from '../components/MyInputGroup.vue';
import LoadingButton from '../components/LoadingButton.vue';
import { useToast } from 'primevue';
import { showToast } from '../../../utils/show-toast';
import type { InputConfig } from '../../../interfaces/input-config.interface';
import router from '../../../../src/router';

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
  createEntity: {
    type: Function,
    required: true,
  },
  loadOptions: {
    type: Function,
    required: false,
  },
});

const isFormSubmitted = ref(false);
const toast = useToast();
const entityData = ref<Record<string, any>>({});
const selectOptions = ref<Record<string, Array<{ label: string; value: any }>>>({});


props.inputs.forEach((input) => {
  entityData.value[input.inputId] = '';
});


onMounted(async () => {
  if (props.loadOptions) {
    try {
      const optionsData = await props.loadOptions();
      props.inputs.forEach((input) => {
        if (input.inputType === 'select' && optionsData[input.inputId]) {
          selectOptions.value[input.inputId] = optionsData[input.inputId];
        }
      });
    } catch (error) {
      showToast(toast, {
        severity: 'error',
        summary: 'Error loading options',
        detail: "Couldn't load fields options",
      });
    }
  }
});

const createEntity = async (leave: boolean) => {
  isFormSubmitted.value = true;

  const isEmptyValue = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };

  const errors = props.inputs
    .filter((input) => {
      if (input.required === false) return false;
      const value = entityData.value[input.inputId];
      return isEmptyValue(value);
    })
    .map((input) => input.label);

  if (errors.length > 0) {
    showToast(toast, {
      severity: 'error',
      summary: 'Missing required fields',
      detail: `The following fields are required: ${errors.join(', ')}`,
    });
    return;
  }

  if (errors.length > 0) {
    showToast(toast, {
      severity: 'error',
      summary: 'Missing required fields',
      detail: `The following fields are required: ${errors.join(', ')}`,
    });
    return;
  }

  try {
    const dataToCreate = { ...entityData.value };
    props.inputs.forEach((input) => {
      const value = dataToCreate[input.inputId];
      if (input.required === false && isEmptyValue(value)) {
        delete dataToCreate[input.inputId];
        return;
      }
      if (input.inputType === 'numeric' && typeof value === 'string') {
        dataToCreate[input.inputId] = parseFloat(value);
      }
    });


    await props.createEntity(dataToCreate);
    showToast(toast, { severity: 'success', summary: 'Created', detail: 'Created correctly' });
    if (leave) router.back()

    props.inputs.forEach((input) => {
      entityData.value[input.inputId] = '';
    });
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Error creating', detail: "Wasn't created" });
  } finally {
    isFormSubmitted.value = false;
  }
};

const clearForm = () => {
  props.inputs.forEach((input) => {
    entityData.value[input.inputId] = '';
  });

  isFormSubmitted.value = false;
}
</script>

<template>
  <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>{{ viewTitle }}</template>

    <template #inputs>
      <MyInputGroup v-for="input in inputs" :key="input.inputId" v-model="entityData[input.inputId]"
        :required="input.required" :label="input.label" :inputId="input.inputId" :input-type="input.inputType"
        :options="selectOptions[input.inputId]" :input-numeric-mode="input.inputNumericMode" :time-only="input.timeOnly"
        :hour-format="input.hourFormat" :is-form-submitted="isFormSubmitted" />

      <div v-if="inputs.length % 2 !== 0"></div>

      <div class="flex">
        <LoadingButton label="Create" @click="createEntity(false)"></LoadingButton>
        <div class="px-4">
          <LoadingButton :outlined="true" label="Create and leave" @click="createEntity(true)"></LoadingButton>
        </div>
        <LoadingButton severity="danger" :outlined="true" label="Clear form" @click="clearForm()" />

      </div>


    </template>
  </CreateLayout>
</template>
