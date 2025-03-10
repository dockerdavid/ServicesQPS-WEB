<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CreateLayout from '../../../layouts/CreateLayout.vue';
import MyInputGroup from '../components/MyInputGroup.vue';
import LoadingButton from '../components/LoadingButton.vue';
import { useToast } from 'primevue';
import { showToast } from '../../../utils/show-toast';
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
        summary: 'Error al cargar opciones',
        detail: 'No se pudieron cargar las opciones para los campos.',
      });
    }
  }
});

const createEntity = async () => {
  isFormSubmitted.value = true;


  const errors = props.inputs
    .filter((input) => input.required && !entityData.value[input.inputId])
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
  
    const dataToCreate = { ...entityData.value };
    props.inputs.forEach((input) => {
      if (input.inputType === 'numeric' && typeof dataToCreate[input.inputId] === 'string') {
        dataToCreate[input.inputId] = parseFloat(dataToCreate[input.inputId]);
      }
    });

    // Llamar a la función de creación
    await props.createEntity(dataToCreate);
    showToast(toast, { severity: 'success', summary: 'Entidad creada', detail: 'La entidad se creó correctamente.' });

    // Resetear el formulario después de una creación exitosa
    props.inputs.forEach((input) => {
      entityData.value[input.inputId] = '';
    });
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Error al crear', detail: 'No se pudo crear la entidad.' });
  } finally {
    isFormSubmitted.value = false;
  }
};
</script>

<template>
  <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>{{ viewTitle }}</template>

    <template #inputs>
      <MyInputGroup
        v-for="input in inputs"
        :key="input.inputId"
        v-model="entityData[input.inputId]"
        :required="input.required"
        :label="input.label"
        :inputId="input.inputId"
        :input-type="input.inputType"
        :options="selectOptions[input.inputId]"
        :input-numeric-mode="input.inputNumericMode"
        :time-only="input.timeOnly"
        :hour-format="input.hourFormat"
        :is-form-submitted="isFormSubmitted"
      />

      <!-- Espacio adicional si el número de inputs es impar -->
      <div v-if="inputs.length % 2 !== 0"></div>

      <!-- Botón de creación -->
      <div>
        <LoadingButton label="Crear" @click="createEntity"></LoadingButton>
      </div>
    </template>
  </CreateLayout>
</template>