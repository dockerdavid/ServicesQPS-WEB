<template>
  <div ref="calendarContainer" class="calendar-container py-2">

    <div class="flex">
      <div class="py-4 pr-4" v-for="status in statusColors">
        <ColorPicker disabled :default-color="status.color" />
        <span class="pl-2">{{ status.value }}</span>
      </div>
    </div>

    <MyFullCalendar ref="fullCalendar" />
  </div>
</template>

<script setup lang="ts">
const statusColors = [
  { color: 'da1919', value: 'Created' },
  { color: 'f7e83a', value: 'Pending' },
  { color: '00e01f', value: 'Assigned' },
  { color: '9500c1', value: 'Rejected' },
  { color: '000000', value: 'Completed' },
  { color: '00a7b2', value: 'Finished' },
]
import { ColorPicker } from 'primevue';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import MyFullCalendar from './components/MyFullCalendar.vue';

const calendarContainer = ref<HTMLElement | null>(null);
const fullCalendar = ref<InstanceType<typeof MyFullCalendar> | null>(null);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (calendarContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (fullCalendar.value) {
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