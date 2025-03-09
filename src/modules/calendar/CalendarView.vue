<template>
    <div ref="calendarContainer" class="calendar-container py-2">
      <MyFullCalendar ref="fullCalendar" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import MyFullCalendar from './components/MyFullCalendar.vue';
  
  // Referencias al calendario y su contenedor
  const calendarContainer = ref<HTMLElement | null>(null);
  const fullCalendar = ref<InstanceType<typeof MyFullCalendar> | null>(null);
  
  // Observador de cambios en el tamaño del contenedor
  let resizeObserver: ResizeObserver | null = null;
  
  onMounted(() => {
    if (calendarContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        if (fullCalendar.value) {
          // Llamar al método updateSize del calendario
          fullCalendar.value.getApi()?.updateSize();
        }
      });
      resizeObserver.observe(calendarContainer.value);
    }
  });
  
  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
  </script>
  
  <style scoped>
  .calendar-container {
    width: 100%;
    height: 100%;
  }
  </style>