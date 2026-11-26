<script setup lang="ts">
import { onMounted } from 'vue';
import { Toast, useToast } from 'primevue';
import { setGlobalToast } from './utils/global-toast';
import { requestLocationPermission } from './composables/useGeolocation';
import ForcePasswordChangeDialog from './modules/auth/components/ForcePasswordChangeDialog.vue';

setGlobalToast(useToast());

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
  <ForcePasswordChangeDialog />
</template>

<style scoped lang="scss"></style>
