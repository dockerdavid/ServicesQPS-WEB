<template>
  <Dialog
    :visible="visible"
    modal
    :closable="!isApplying"
    :close-on-escape="!isApplying"
    :draggable="false"
    :style="{ width: '960px', maxWidth: '96vw' }"
    :breakpoints="{ '640px': '100vw' }"
    :content-style="{ padding: 0 }"
    class="suggest-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="suggest-dialog__header">
        <span class="suggest-dialog__icon"><i class="pi pi-sparkles" /></span>
        <div>
          <h2>Sugerencias de asignación</h2>
          <p>Reparto propuesto para los servicios sin cleaner de {{ rangeLabel }}</p>
        </div>
      </div>
    </template>

    <div v-if="result" class="suggest-dialog__body">
      <!-- Resumen -->
      <section class="summary">
        <div class="summary__stat">
          <span class="summary__label">Sin cleaner</span>
          <span class="summary__value">{{ result.suggestions.length }}</span>
          <label v-if="result.omittedPast.length || includePast" class="summary__past">
            <Checkbox
              :model-value="includePast"
              binary
              input-id="suggest-include-past"
              @update:model-value="emit('update:includePast', Boolean($event))"
            />
            <span>
              Incluir fechas pasadas
              <template v-if="!includePast">({{ result.omittedPast.length }})</template>
            </span>
          </label>
        </div>
        <div class="summary__stat summary__stat--balance">
          <span class="summary__label">Balance</span>
          <span class="summary__balance">
            <BalanceGauge :score="result.currentScore" size="md" />
            <i class="pi pi-arrow-right summary__arrow" />
            <BalanceGauge :score="result.projectedScore" size="md" />
          </span>
          <span class="summary__hint" :class="deltaClass">{{ deltaText }}</span>
        </div>
        <div class="summary__stat">
          <span class="summary__label">Se asignarán</span>
          <span class="summary__value summary__value--accent">{{ applicableCount }}</span>
          <span class="summary__hint">
            {{ manualCount }} manual · {{ skippedCount }} excluido(s)
          </span>
        </div>
      </section>

      <p class="legend">
        <i class="pi pi-info-circle" />
        Se elige el cleaner con menor costo: carga ese día (peso alto) + carga en el rango + choque de horario,
        con un pequeño bonus si ya trabajó en la comunidad. Al cambiar un cleaner, el resto se recalcula.
      </p>

      <div v-if="!result.suggestions.length" class="empty">
        <i class="pi pi-check-circle" />
        <p v-if="result.omittedPast.length">
          Solo quedan servicios sin cleaner en fechas pasadas. Marca “Incluir fechas pasadas” para verlos.
        </p>
        <p v-else>No hay servicios sin cleaner en este rango.</p>
      </div>

      <!-- Lista agrupada por dia -->
      <div v-else class="groups">
        <section v-for="group in groups" :key="group.date" class="group">
          <h3 class="group__title">
            <span>{{ formatDayTitle(group.date) }}</span>
            <span class="group__count">{{ group.rows.length }}</span>
          </h3>
          <div
            v-for="row in group.rows"
            :key="row.serviceId"
            class="row"
            :class="{ 'is-skipped': row.skipped, 'is-pinned': row.pinned, 'has-clash': (row.chosen?.clashes ?? 0) > 0 }"
          >
            <Checkbox
              :model-value="!row.skipped"
              binary
              :input-id="`suggest-include-${row.serviceId}`"
              :disabled="isApplying"
              :aria-label="row.skipped ? 'Incluir' : 'Excluir'"
              @update:model-value="emit('skip', row.serviceId, !$event)"
            />
            <div class="row__service">
              <span class="row__title">
                <span v-if="row.service.schedule" class="row__time">{{ formatTime(row.service.schedule) }}</span>
                {{ row.service.communityName || 'Sin comunidad' }}
              </span>
              <span class="row__meta">
                Unit {{ row.service.unitNumber || 'N/A' }}<template v-if="row.service.typeName"> · {{ row.service.typeName }}</template>
              </span>
            </div>
            <div class="row__cleaner">
              <Select
                :model-value="row.cleanerId"
                :options="row.candidates"
                option-label="name"
                option-value="cleanerId"
                filter
                filter-placeholder="Buscar cleaner"
                :disabled="row.skipped || isApplying"
                placeholder="Sin cleaner"
                class="w-full"
                size="small"
                append-to="body"
                @update:model-value="emit('pin', row.serviceId, $event)"
              >
                <template #value="{ value }">
                  <span v-if="value" class="cleaner-value">
                    <span class="cleaner-value__name">{{ row.cleanerName }}</span>
                    <span v-if="row.pinned" class="pill pill--manual">manual</span>
                  </span>
                  <span v-else class="text-gray-400">Sin cleaner</span>
                </template>
                <template #option="{ option, index }">
                  <div class="cleaner-option">
                    <span class="cleaner-option__name">
                      {{ option.name }}
                      <span v-if="index === 0" class="pill pill--best">mejor</span>
                    </span>
                    <span class="cleaner-option__meta">
                      <span :class="{ warn: option.dayLoad > 0 }">{{ option.dayLoad }} ese día</span>
                      · {{ option.rangeLoad }} rango
                      <span v-if="option.clashes" class="danger">· choque</span>
                      <span v-if="option.familiar" class="ok">· conoce</span>
                    </span>
                  </div>
                </template>
              </Select>
            </div>
            <div class="row__reason">
              <span>{{ row.reason }}</span>
              <button
                v-if="row.pinned && !isApplying"
                type="button"
                class="row__reset"
                title="Volver a la sugerencia automática"
                @click="emit('pin', row.serviceId, null)"
              >
                <i class="pi pi-undo" /> auto
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <div class="suggest-dialog__footer">
        <template v-if="isApplying">
          <div class="progress">
            <ProgressBar :value="progressPercent" :show-value="false" style="height: 6px" />
            <span>Asignando {{ progress.done }} / {{ progress.total }}<template v-if="progress.failed"> · {{ progress.failed }} con error</template></span>
          </div>
        </template>
        <template v-else-if="confirming">
          <span class="confirm-text">
            <i class="pi pi-exclamation-circle" />
            Se asignarán <b>{{ applicableCount }}</b> servicio(s) y cada cleaner recibirá la notificación.
          </span>
          <Button label="Volver" severity="secondary" text @click="confirming = false" />
          <Button label="Sí, asignar" icon="pi pi-check" @click="confirmApply" />
        </template>
        <template v-else>
          <Button
            label="Restablecer"
            icon="pi pi-refresh"
            severity="secondary"
            text
            :disabled="!manualCount && !skippedCount"
            @click="emit('reset')"
          />
          <span class="footer-spacer" />
          <Button label="Descartar" severity="secondary" outlined @click="emit('discard')" />
          <Button label="Ver en calendario" severity="secondary" outlined icon="pi pi-calendar" @click="emit('update:visible', false)" />
          <Button
            :label="`Aplicar ${applicableCount}`"
            icon="pi pi-check"
            :disabled="!applicableCount"
            @click="confirming = true"
          />
        </template>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button, Checkbox, Dialog, ProgressBar, Select } from 'primevue';

import BalanceGauge from './BalanceGauge.vue';
import type { ApplyProgress } from '../composables/useLoadBalancer';
import type { AssignmentSuggestion, SuggestResult } from '../utils/load-balancer';

const props = defineProps<{
  visible: boolean;
  result: SuggestResult | null;
  includePast: boolean;
  isApplying: boolean;
  progress: ApplyProgress;
  rangeLabel: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'update:includePast': [value: boolean];
  pin: [serviceId: string, cleanerId: string | null];
  skip: [serviceId: string, skipped: boolean];
  reset: [];
  discard: [];
  apply: [];
}>();

const confirming = ref(false);
watch(() => props.visible, (v) => { if (!v) confirming.value = false; });

const confirmApply = () => {
  confirming.value = false;
  emit('apply');
};

const groups = computed(() => {
  const map = new Map<string, AssignmentSuggestion[]>();
  props.result?.suggestions.forEach((s) => {
    const list = map.get(s.service.date) ?? [];
    list.push(s);
    map.set(s.service.date, list);
  });
  return [...map.entries()].map(([date, rows]) => ({ date, rows }));
});

const applicableCount = computed(() => props.result?.suggestions.filter((s) => !s.skipped && s.cleanerId).length ?? 0);
const manualCount = computed(() => props.result?.suggestions.filter((s) => s.pinned).length ?? 0);
const skippedCount = computed(() => props.result?.suggestions.filter((s) => s.skipped).length ?? 0);

const delta = computed(() => {
  const r = props.result;
  if (!r || r.currentScore === null || r.projectedScore === null) return null;
  return r.projectedScore - r.currentScore;
});
const deltaText = computed(() => {
  if (delta.value === null) return props.result?.projectedScore != null ? 'Balance proyectado' : 'Sin datos';
  if (delta.value === 0) return 'Sin cambio';
  return `${delta.value > 0 ? '+' : ''}${delta.value} puntos`;
});
const deltaClass = computed(() => (delta.value === null || delta.value === 0 ? '' : delta.value > 0 ? 'ok' : 'danger'));

const progressPercent = computed(() =>
  props.progress.total ? Math.round((props.progress.done / props.progress.total) * 100) : 0,
);

const formatDayTitle = (yyyymmdd: string) => {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatTime = (schedule: string) => {
  const match = /(\d{1,2}):(\d{2})/.exec(schedule);
  if (!match) return schedule;
  const h = Number(match[1]);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${match[2]} ${suffix}`;
};
</script>

<style scoped>
.suggest-dialog__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.suggest-dialog__header h2 { font-size: 1.15rem; font-weight: 700; color: var(--ink-900); line-height: 1.2; }
.suggest-dialog__header p { font-size: 0.8rem; color: var(--ink-500); }
.suggest-dialog__icon {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #ede9fe, var(--accent-100));
  color: #6d28d9;
}

.suggest-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0 1.25rem 1rem;
}

/* --- resumen --- */
.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.summary__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: var(--surface-50);
}
.summary__label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-500); font-weight: 600; }
.summary__value { font-size: 1.6rem; font-weight: 700; color: var(--ink-900); line-height: 1.1; font-variant-numeric: tabular-nums; }
.summary__value--accent { color: var(--accent-600); }
.summary__balance { display: flex; align-items: center; gap: 0.5rem; }
.summary__arrow { color: var(--ink-500); font-size: 0.8rem; }
.summary__hint { font-size: 0.75rem; color: var(--ink-500); }
.summary__past {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--ink-700);
  cursor: pointer;
}

.legend {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--ink-500);
  line-height: 1.45;
}
.legend .pi { margin-top: 0.15rem; color: var(--accent-500); }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--ink-500);
  text-align: center;
}
.empty .pi { font-size: 1.8rem; color: #16a34a; }

/* --- grupos --- */
.groups { display: flex; flex-direction: column; gap: 0.9rem; }
.group__title {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink-700);
  background: #fff;
  border-bottom: 1px solid var(--border-soft);
}
.group__count {
  font-size: 0.7rem;
  background: var(--surface-100);
  color: var(--ink-500);
  border-radius: 999px;
  padding: 0 0.45rem;
}

.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1.2fr) minmax(12rem, 1fr) minmax(0, 1.3fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.5rem;
  border-bottom: 1px dashed var(--border-soft);
  transition: background 0.15s ease, opacity 0.15s ease;
}
.row:hover { background: var(--surface-50); }
.row.is-skipped { opacity: 0.5; }
.row.is-skipped .row__title { text-decoration: line-through; }
.row.has-clash .row__reason { color: #b45309; }

.row__service { display: flex; flex-direction: column; min-width: 0; }
.row__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row__time {
  display: inline-block;
  margin-right: 0.3rem;
  padding: 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-700);
  background: var(--accent-100);
  border-radius: 4px;
}
.row__meta { font-size: 0.72rem; color: var(--ink-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row__reason {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.73rem;
  color: var(--ink-500);
  line-height: 1.35;
}
.row__reset {
  flex-shrink: 0;
  border: 1px solid var(--border-soft);
  background: #fff;
  border-radius: 999px;
  padding: 0 0.45rem;
  font-size: 0.68rem;
  color: var(--ink-700);
  cursor: pointer;
}
.row__reset .pi { font-size: 0.6rem; }

.cleaner-value { display: inline-flex; align-items: center; gap: 0.35rem; min-width: 0; }
.cleaner-value__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cleaner-option { display: flex; flex-direction: column; line-height: 1.25; }
.cleaner-option__name { display: flex; align-items: center; gap: 0.35rem; font-weight: 600; font-size: 0.85rem; }
.cleaner-option__meta { font-size: 0.72rem; color: var(--ink-500); }
.cleaner-option__meta .warn { color: #b45309; }
.cleaner-option__meta .danger, .danger { color: #dc2626; }
.cleaner-option__meta .ok, .ok { color: #15803d; }

.pill {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.3rem;
  border-radius: 4px;
}
.pill--manual { background: #ede9fe; color: #6d28d9; }
.pill--best { background: #dcfce7; color: #15803d; }

/* --- footer --- */
.suggest-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}
.footer-spacer { flex: 1; }
.confirm-text { flex: 1; display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--ink-700); }
.confirm-text .pi { color: #d97706; }
.progress { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; color: var(--ink-500); }

@media (max-width: 760px) {
  .summary { grid-template-columns: 1fr 1fr; }
  .summary__stat--balance { grid-column: 1 / -1; order: -1; }
  .row {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.4rem 0.6rem;
  }
  .row__cleaner, .row__reason { grid-column: 2; }
  .footer-spacer { display: none; }
  .suggest-dialog__footer :deep(.p-button) { flex: 1 1 auto; }
}
</style>
