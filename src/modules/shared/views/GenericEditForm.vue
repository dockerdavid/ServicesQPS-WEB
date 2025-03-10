<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import CreateLayout from '@/layouts/CreateLayout.vue';
import MyInputGroup from '../components/MyInputGroup.vue';
import LoadingButton from '../components/LoadingButton.vue';
import { useToast } from 'primevue';
import { showToast } from '@/utils/show-toast';
import { useRoute } from 'vue-router';
import type { InputConfig } from '@/interfaces/input-config.interface';




// Props
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

const toast = useToast();
const route = useRoute();
const entityId = route.params.id as string;
const entityData = ref({ ...props.initialData });

// Función para acceder a valores anidados dinámicamente
const getNestedValue = (source: Record<string, any>, path: string) => {
  return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), source);
};

// Función para llenar los valores iniciales
const fillInitialData = (source: Record<string, any>, target: Record<string, any>) => {
  props.inputs.forEach((input) => {
    if (input.inputType === 'select') {
      // Usar el keyValueMap para asignar el valor inicial
      const sourceKey = props.keyValueMap[input.inputId] || input.inputId;
      target[input.inputId] = getNestedValue(source, sourceKey);
    } else {
      // Para otros campos (inputs, fechas, etc.)
      target[input.inputId] = source[input.inputId] || '';
    }
  });

  // Mantener el ID original si está presente en los datos cargados
  if (source.id) {
    target.id = source.id;
  }
};

// Función para actualizar las opciones de los selects
const updateSelectOptions = (data: Record<string, any>) => {
  props.inputs.forEach((input) => {
    if (input.inputType === 'select' && data[input.inputId + 'Options']) {
      input.options = data[input.inputId + 'Options'];
    }
  });
};

// Watcher para sincronizar el valor inicial de los selects con las opciones
watch(
  () => props.inputs,
  (newInputs) => {
    newInputs.forEach((input) => {
      if (input.inputType === 'select' && input.options) {
        // Si el valor inicial no está en las opciones, lo reseteamos
        if (entityData.value[input.inputId] && !input.options.some((option) => option.value === entityData.value[input.inputId])) {
          entityData.value[input.inputId] = '';
        }
      }
    });
  },
  { deep: true }
);

const updateEntity = async () => {
  try {
    // Convertir campos numéricos a number antes de enviar
    const dataToUpdate = { ...entityData.value };
    props.inputs.forEach((input) => {
      if (input.inputType === 'numeric' && typeof dataToUpdate[input.inputId] === 'string') {
        dataToUpdate[input.inputId] = parseFloat(dataToUpdate[input.inputId]);
      }
    });

    await props.updateEntity(entityId, dataToUpdate);
    showToast(toast, { severity: 'success', summary: 'Entity updated' });
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Entity wasn't updated" });
  }
};

onMounted(async () => {
  const data = await props.loadData(entityId);

  // Actualiza las opciones de los selects
  updateSelectOptions(data);

  // Llena los valores iniciales
  fillInitialData(data, entityData.value);
});
</script>

<template>
  <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>{{ viewTitle }}</template>

    <template #inputs>
      <MyInputGroup v-for="input in inputs" :key="input.inputId" v-model="entityData[input.inputId]"
        :label="input.label" :inputId="input.inputId" :input-type="input.inputType" :options="input.options"
        :input-numeric-mode="input.inputNumericMode" :time-only="input.timeOnly" :hour-format="input.hourFormat" />

      <div v-if="inputs.length % 2 !== 0" ></div>

      <div>
        <LoadingButton label="Edit" @click="updateEntity"></LoadingButton>
      </div>
    </template>
  </CreateLayout>
</template>