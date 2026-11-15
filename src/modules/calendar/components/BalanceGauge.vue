<template>
  <div
    class="balance-gauge"
    :class="[`balance-gauge--${grade}`, `balance-gauge--${size}`]"
    :title="title"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="score ?? undefined"
    :aria-label="title"
  >
    <svg viewBox="0 0 36 36" class="balance-gauge__ring" aria-hidden="true">
      <circle class="balance-gauge__track" cx="18" cy="18" r="15.5" />
      <circle
        class="balance-gauge__value"
        cx="18"
        cy="18"
        r="15.5"
        :stroke-dasharray="`${dash} ${CIRCUMFERENCE}`"
      />
    </svg>
    <span class="balance-gauge__label">{{ score ?? '–' }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { GRADE_LABELS, gradeForScore } from '../utils/load-balancer';

const props = withDefaults(defineProps<{
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}>(), { size: 'md' });

const CIRCUMFERENCE = 2 * Math.PI * 15.5;

const grade = computed(() => gradeForScore(props.score));
const dash = computed(() => ((props.score ?? 0) / 100) * CIRCUMFERENCE);

const title = computed(() =>
  props.score === null ? 'Balance: sin servicios asignados' : `Balance ${props.score}/100 · ${GRADE_LABELS[grade.value]}`,
);
</script>

<style scoped>
.balance-gauge {
  --gauge-color: #9ca3af;
  position: relative;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}
.balance-gauge--good { --gauge-color: #16a34a; }
.balance-gauge--fair { --gauge-color: #d97706; }
.balance-gauge--poor { --gauge-color: #dc2626; }

.balance-gauge--sm { width: 2rem; height: 2rem; font-size: 0.7rem; }
.balance-gauge--md { width: 3.25rem; height: 3.25rem; font-size: 0.95rem; }
.balance-gauge--lg { width: 4.25rem; height: 4.25rem; font-size: 1.25rem; }

.balance-gauge__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}
.balance-gauge__track {
  fill: none;
  stroke: #ece7df;
  stroke-width: 3.5;
}
.balance-gauge__value {
  fill: none;
  stroke: var(--gauge-color);
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), stroke 0.3s ease;
}
.balance-gauge__label {
  position: relative;
  font-weight: 700;
  color: var(--gauge-color);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
</style>
