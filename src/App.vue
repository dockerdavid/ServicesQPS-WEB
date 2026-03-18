<script setup lang="ts">
import { onMounted } from 'vue';
import { Toast } from 'primevue';
import { requestLocationPermission } from './composables/useGeolocation';

// Persistently ask for location permission until granted
const ensureLocationPermission = async () => {
  if (!navigator.geolocation) return;

  const poll = async () => {
    const state = await requestLocationPermission();
    if (state !== 'granted') {
      // Re-ask after 5 seconds if still not granted
      setTimeout(poll, 5000);
    }
  };

  poll();
};

onMounted(() => {
  ensureLocationPermission();
});
</script>

<template>
  <Toast />
  <RouterView />
</template>

<style scoped lang="scss"></style>
