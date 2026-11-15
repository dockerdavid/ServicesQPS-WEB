<template>
  <aside class="workload-panel" :class="{ 'is-compact': isCompact, 'is-open': !isCompact || expanded }">
    <!-- Barra compacta (mobile / tablet): resumen + abrir/cerrar -->
    <button
      v-if="isCompact"
      type="button"
      class="workload-panel__bar"
      :aria-expanded="expanded"
      aria-controls="workload-panel-body"
      @click="expanded = !expanded"
    >
      <BalanceGauge :score="balance.score" size="sm" />
      <span class="workload-panel__bar-text">
        <strong>Carga de cleaners</strong>
        <span class="workload-panel__bar-sub">
          {{ GRADE_LABELS[balance.grade] }}
          <template v-if="unassignedCount"> · {{ unassignedCount }} sin asignar</template>
        </span>
      </span>
      <span v-if="selectedLabel" class="workload-panel__bar-filter" @click.stop="select(null)">
        <i class="pi pi-filter" /> {{ selectedLabel }} <i class="pi pi-times" />
      </span>
      <i class="pi" :class="expanded ? 'pi-chevron-up' : 'pi-chevron-down'" />
    </button>

    <div v-show="!isCompact || expanded" id="workload-panel-body" class="workload-panel__body">
      <!-- Encabezado -->
      <header v-if="!isCompact" class="workload-panel__header">
        <div>
          <h2 class="workload-panel__title">Carga de cleaners</h2>
          <p class="workload-panel__subtitle">{{ rangeLabel }} · {{ balance.totalAssigned }} asignados</p>
        </div>
        <i class="pi pi-users workload-panel__title-icon" />
      </header>

      <!-- Balance -->
      <section class="balance-card" :class="`balance-card--${balance.grade}`">
        <BalanceGauge :score="balance.score" size="lg" />
        <div class="balance-card__info">
          <div class="balance-card__grade">
            {{ GRADE_LABELS[balance.grade] }}
            <span
              v-if="projectedScore !== null && projectedScore !== balance.score"
              class="balance-card__projection"
              :title="'Balance si se aplican las sugerencias'"
            >
              <i class="pi pi-arrow-right" /> {{ projectedScore }}
            </span>
          </div>
          <div class="balance-card__stats">
            <span title="Promedio de servicios por cleaner activo"><b>{{ balance.mean }}</b> prom.</span>
            <span title="Desviación estándar"><b>±{{ balance.stdDev }}</b></span>
            <span title="Cleaners activos en el cálculo"><b>{{ balance.poolSize }}</b> activos</span>
          </div>
        </div>
      </section>

      <div v-if="balance.overloaded.length || balance.underloaded.length" class="balance-flags">
        <div v-if="balance.overloaded.length" class="balance-flags__row balance-flags__row--over">
          <i class="pi pi-arrow-up" />
          <span class="balance-flags__label">Sobrecarga</span>
          <button
            v-for="w in balance.overloaded.slice(0, 4)"
            :key="w.cleanerId"
            type="button"
            class="flag-chip"
            @click="select(w.cleanerId)"
          >{{ firstName(w.name) }} <b>{{ w.total }}</b></button>
          <span v-if="balance.overloaded.length > 4" class="flag-more">+{{ balance.overloaded.length - 4 }}</span>
        </div>
        <div v-if="balance.underloaded.length" class="balance-flags__row balance-flags__row--under">
          <i class="pi pi-arrow-down" />
          <span class="balance-flags__label">Poca carga</span>
          <button
            v-for="w in balance.underloaded.slice(0, 4)"
            :key="w.cleanerId"
            type="button"
            class="flag-chip"
            @click="select(w.cleanerId)"
          >{{ firstName(w.name) }} <b>{{ w.total }}</b></button>
          <span v-if="balance.underloaded.length > 4" class="flag-more">+{{ balance.underloaded.length - 4 }}</span>
        </div>
      </div>

      <Button
        v-if="canSuggest && unassignedCount > 0"
        class="workload-panel__suggest"
        icon="pi pi-sparkles"
        :label="suggestionsActive ? 'Revisar sugerencias' : `Sugerir asignaciones (${unassignedCount})`"
        size="small"
        @click="emit('suggest')"
      />

      <!-- Busqueda y opciones -->
      <div class="workload-panel__tools">
        <IconField class="w-full">
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" placeholder="Buscar cleaner…" class="w-full" size="small" aria-label="Buscar cleaner" />
        </IconField>
        <div class="workload-panel__options">
          <div class="sort-toggle" role="group" aria-label="Ordenar">
            <button type="button" :class="{ active: sortBy === 'load' }" @click="sortBy = 'load'">Carga</button>
            <button type="button" :class="{ active: sortBy === 'name' }" @click="sortBy = 'name'">Nombre</button>
          </div>
          <label class="qa-toggle">
            <ToggleSwitch :model-value="includeQa" @update:model-value="emit('update:includeQa', $event)" />
            <span>Incluir QA</span>
          </label>
        </div>
      </div>

      <!-- Lista -->
      <ul class="cleaner-list" role="listbox" aria-label="Cleaners" @mouseleave="emit('hover', null)">
        <li
          v-if="unassignedCount > 0 && matchesSearch('sin asignar unassigned')"
          role="option"
          :aria-selected="selectedId === UNASSIGNED_FILTER"
          class="cleaner-row cleaner-row--unassigned"
          :class="{ 'is-selected': selectedId === UNASSIGNED_FILTER }"
          tabindex="0"
          @click="toggle(UNASSIGNED_FILTER)"
          @keydown.enter.prevent="toggle(UNASSIGNED_FILTER)"
          @keydown.space.prevent="toggle(UNASSIGNED_FILTER)"
        >
          <span class="cleaner-row__avatar cleaner-row__avatar--warn"><i class="pi pi-exclamation-triangle" /></span>
          <span class="cleaner-row__main">
            <span class="cleaner-row__name">Sin asignar</span>
            <span class="cleaner-row__meta">Servicios sin cleaner</span>
          </span>
          <span class="cleaner-row__count">{{ unassignedCount }}</span>
        </li>

        <li
          v-for="w in visibleRows"
          :key="w.cleanerId"
          role="option"
          :aria-selected="selectedId === w.cleanerId"
          class="cleaner-row"
          :class="[`cleaner-row--${w.level}`, { 'is-selected': selectedId === w.cleanerId, 'is-inactive': !w.active }]"
          tabindex="0"
          @click="toggle(w.cleanerId)"
          @keydown.enter.prevent="toggle(w.cleanerId)"
          @keydown.space.prevent="toggle(w.cleanerId)"
          @mouseenter="emit('hover', w.cleanerId)"
          @focus="emit('hover', w.cleanerId)"
          @blur="emit('hover', null)"
        >
          <span class="cleaner-row__avatar" :style="{ background: avatarColor(w.cleanerId) }">{{ initials(w.name) }}</span>
          <span class="cleaner-row__main">
            <span class="cleaner-row__name">
              {{ w.name }}
              <span v-if="w.roleId === '7'" class="mini-tag">QA</span>
              <span v-if="!w.active" class="mini-tag mini-tag--muted">inactivo</span>
              <span v-if="w.level === 'over'" class="mini-tag mini-tag--over" title="Más carga que el promedio">alta</span>
              <span v-else-if="w.level === 'under' || (w.level === 'idle' && w.active && balance.mean >= 2)" class="mini-tag mini-tag--under" title="Menos carga que el promedio">baja</span>
            </span>
            <span class="cleaner-row__bar" aria-hidden="true">
              <span class="cleaner-row__bar-fill" :style="{ width: barWidth(w.total) }" />
              <span
                v-if="suggestedFor(w.cleanerId) > 0"
                class="cleaner-row__bar-proj"
                :style="{ width: barWidth(suggestedFor(w.cleanerId)) }"
              />
            </span>
            <span class="cleaner-row__meta">
              <span title="Máximo de servicios en un mismo día">máx {{ w.maxPerDay }}/día</span>
              <span>· {{ w.daysWorked }} {{ w.daysWorked === 1 ? 'día' : 'días' }}</span>
              <span v-if="w.communities">· {{ w.communities }} com.</span>
            </span>
          </span>
          <span class="cleaner-row__count">
            {{ w.total }}
            <span v-if="suggestedFor(w.cleanerId) > 0" class="cleaner-row__plus" title="Servicios sugeridos">+{{ suggestedFor(w.cleanerId) }}</span>
          </span>

          <!-- Detalle del seleccionado: mapa del rango -->
          <div v-if="selectedId === w.cleanerId && rangeDays.length" class="cleaner-row__detail" @click.stop>
            <div class="heat-strip" :style="{ gridTemplateColumns: `repeat(${Math.min(rangeDays.length, 16)}, 1fr)` }">
              <span
                v-for="day in rangeDays"
                :key="day"
                class="heat-strip__cell"
                :class="heatClass(w.perDay[day] ?? 0)"
                :title="`${formatShort(day)}: ${w.perDay[day] ?? 0} servicio(s)`"
              />
            </div>
            <p v-if="w.busiestDay" class="cleaner-row__detail-text">
              Día más cargado: <b>{{ formatShort(w.busiestDay) }}</b> ({{ w.maxPerDay }})
            </p>
            <p v-else class="cleaner-row__detail-text">Sin servicios en el rango.</p>
          </div>
        </li>

        <li v-if="!visibleRows.length && !(unassignedCount > 0 && matchesSearch('sin asignar'))" class="cleaner-list__empty">
          <template v-if="search">Ningún cleaner coincide con “{{ search }}”.</template>
          <template v-else>No hay cleaners para mostrar.</template>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Button, IconField, InputIcon, InputText, ToggleSwitch } from 'primevue';

import BalanceGauge from './BalanceGauge.vue';
import { UNASSIGNED_FILTER } from '../composables/useLoadBalancer';
import { GRADE_LABELS, type BalanceSummary, type CleanerWorkload } from '../utils/load-balancer';

const props = withDefaults(defineProps<{
  workloads: CleanerWorkload[];
  balance: BalanceSummary;
  unassignedCount: number;
  selectedId: string | null;
  includeQa: boolean;
  rangeDays: string[];
  rangeLabel: string;
  canSuggest?: boolean;
  suggestionsActive?: boolean;
  projectedScore?: number | null;
  /** cleanerId -> cantidad de servicios sugeridos para el. */
  suggestedByCleaner?: Record<string, number>;
}>(), {
  canSuggest: false,
  suggestionsActive: false,
  projectedScore: null,
  suggestedByCleaner: () => ({}),
});

const emit = defineEmits<{
  'update:selectedId': [value: string | null];
  'update:includeQa': [value: boolean];
  hover: [cleanerId: string | null];
  suggest: [];
}>();

const search = ref('');
const sortBy = ref<'load' | 'name'>('load');
const expanded = ref(false);

// < lg: el panel pasa a ser una barra colapsable arriba del calendario.
const isCompact = ref(false);
let media: MediaQueryList | null = null;
const syncMedia = () => { isCompact.value = Boolean(media?.matches); };
onMounted(() => {
  media = window.matchMedia('(max-width: 1023.98px)');
  syncMedia();
  media.addEventListener('change', syncMedia);
});
onBeforeUnmount(() => media?.removeEventListener('change', syncMedia));

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const matchesSearch = (text: string) => !search.value.trim() || normalize(text).includes(normalize(search.value.trim()));

const visibleRows = computed(() => {
  const rows = props.workloads.filter((w) => matchesSearch(w.name));
  return rows.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (sortBy.value === 'load' && a.total !== b.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });
});

const maxTotal = computed(() =>
  Math.max(1, ...props.workloads.map((w) => w.total + (props.suggestedByCleaner[w.cleanerId] ?? 0))),
);
const barWidth = (n: number) => `${Math.round((n / maxTotal.value) * 100)}%`;
const suggestedFor = (id: string) => props.suggestedByCleaner[id] ?? 0;

const selectedLabel = computed(() => {
  if (!props.selectedId) return '';
  if (props.selectedId === UNASSIGNED_FILTER) return 'Sin asignar';
  return firstName(props.workloads.find((w) => w.cleanerId === props.selectedId)?.name ?? 'Cleaner');
});

const select = (id: string | null) => emit('update:selectedId', id);
const toggle = (id: string) => select(props.selectedId === id ? null : id);

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
const firstName = (name: string) => name.split(/\s+/)[0] || name;

const AVATAR_COLORS = ['#2d6cdf', '#0f766e', '#7c3aed', '#c2410c', '#be185d', '#0369a1', '#4d7c0f', '#a16207'];
const avatarColor = (id: string) => {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const heatClass = (count: number) => `heat-${Math.min(count, 3)}`;

const formatShort = (yyyymmdd: string) => {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
};
</script>

<style scoped>
.workload-panel {
  position: sticky;
  top: 0.75rem;
  align-self: flex-start;
  width: 100%;
  max-height: calc(100vh - 1.5rem);
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  box-shadow: var(--shadow-tight);
  backdrop-filter: blur(10px);
  z-index: 6;
  overflow: hidden;
}

.workload-panel.is-compact {
  top: 0;
  max-height: none;
}
.workload-panel.is-compact.is-open {
  max-height: calc(100vh - 1rem);
}

/* --- barra compacta --- */
.workload-panel__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--ink-800);
}
.workload-panel__bar-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}
.workload-panel__bar-text strong { font-weight: 700; font-size: 0.9rem; }
.workload-panel__bar-sub { font-size: 0.78rem; color: var(--ink-500); }
.workload-panel__bar-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 45%;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-700);
  background: var(--accent-100);
  border: 1px solid var(--accent-200);
  border-radius: 999px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.workload-panel__bar-filter .pi { font-size: 0.65rem; }

/* --- cuerpo --- */
.workload-panel__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  min-height: 0;
  flex: 1;
}
.is-compact .workload-panel__body {
  border-top: 1px solid var(--border-soft);
  padding-top: 0.75rem;
}

.workload-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.workload-panel__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink-900);
  line-height: 1.2;
}
.workload-panel__subtitle {
  font-size: 0.78rem;
  color: var(--ink-500);
}
.workload-panel__title-icon {
  color: var(--accent-500);
  background: var(--accent-100);
  padding: 0.45rem;
  border-radius: 10px;
}

/* --- balance --- */
.balance-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: var(--surface-50);
  border: 1px solid var(--border-soft);
}
.balance-card--good { background: #f0fdf4; border-color: #bbf7d0; }
.balance-card--fair { background: #fffbeb; border-color: #fde68a; }
.balance-card--poor { background: #fef2f2; border-color: #fecaca; }
.balance-card__info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.balance-card__grade {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--ink-900);
}
.balance-card__projection {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-700);
  background: var(--accent-100);
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
}
.balance-card__projection .pi { font-size: 0.6rem; }
.balance-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.6rem;
  font-size: 0.75rem;
  color: var(--ink-500);
}
.balance-card__stats b { color: var(--ink-800); font-variant-numeric: tabular-nums; }

.balance-flags { display: flex; flex-direction: column; gap: 0.35rem; }
.balance-flags__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
}
.balance-flags__row .pi { font-size: 0.7rem; }
.balance-flags__row--over .pi { color: #dc2626; }
.balance-flags__row--under .pi { color: #2563eb; }
.balance-flags__label { color: var(--ink-500); margin-right: 0.15rem; }
.flag-chip {
  border: 1px solid var(--border-soft);
  background: #fff;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.73rem;
  color: var(--ink-700);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.flag-chip:hover { border-color: var(--accent-500); background: var(--accent-100); }
.balance-flags__row--over .flag-chip b { color: #b91c1c; }
.balance-flags__row--under .flag-chip b { color: #1d4ed8; }
.flag-more { color: var(--ink-500); }

.workload-panel__suggest { width: 100%; justify-content: center; }

/* --- herramientas --- */
.workload-panel__tools { display: flex; flex-direction: column; gap: 0.5rem; }
.workload-panel__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.sort-toggle {
  display: inline-flex;
  padding: 2px;
  background: var(--surface-100);
  border-radius: 8px;
}
.sort-toggle button {
  border: none;
  background: none;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  border-radius: 6px;
  color: var(--ink-500);
  cursor: pointer;
}
.sort-toggle button.active {
  background: #fff;
  color: var(--ink-900);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
}
.qa-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--ink-700);
  cursor: pointer;
}
.qa-toggle :deep(.p-toggleswitch) { transform: scale(0.8); transform-origin: right center; }

/* --- lista --- */
.cleaner-list {
  list-style: none;
  padding: 0;
  margin: 0 -0.35rem;
  overflow-y: auto;
  min-height: 6rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.is-compact .cleaner-list { max-height: 45vh; flex: none; }

.cleaner-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.55rem;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  outline: none;
}
.cleaner-row:hover { background: var(--surface-50); }
.cleaner-row:focus-visible { border-color: var(--accent-500); }
.cleaner-row.is-selected {
  background: var(--accent-100);
  border-color: var(--accent-200);
  box-shadow: inset 3px 0 0 var(--accent-500);
}
.cleaner-row.is-inactive { opacity: 0.6; }

.cleaner-row__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.cleaner-row__avatar--warn { background: #fee2e2; color: #b91c1c; }
.cleaner-row__avatar--warn .pi { font-size: 0.8rem; }

.cleaner-row__main { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.cleaner-row__name {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cleaner-row__meta {
  display: flex;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: var(--ink-500);
  white-space: nowrap;
}
.cleaner-row__bar {
  position: relative;
  display: flex;
  height: 4px;
  border-radius: 999px;
  background: #efebe4;
  overflow: hidden;
}
.cleaner-row__bar-fill {
  display: block;
  height: 100%;
  background: var(--accent-500);
  border-radius: 999px;
  transition: width 0.35s ease;
}
.cleaner-row--over .cleaner-row__bar-fill { background: #dc2626; }
.cleaner-row--under .cleaner-row__bar-fill { background: #60a5fa; }
.cleaner-row__bar-proj {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(45deg, #a78bfa 0 3px, #c4b5fd 3px 6px);
  transition: width 0.35s ease;
}
.cleaner-row__count {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--ink-900);
  font-variant-numeric: tabular-nums;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
}
.cleaner-row--unassigned .cleaner-row__count { color: #b91c1c; }
.cleaner-row__plus { font-size: 0.68rem; font-weight: 700; color: #7c3aed; }

.mini-tag {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.3rem;
  border-radius: 4px;
  background: var(--accent-100);
  color: var(--accent-700);
  flex-shrink: 0;
}
.mini-tag--muted { background: #f3f4f6; color: var(--ink-500); }
.mini-tag--over { background: #fee2e2; color: #b91c1c; }
.mini-tag--under { background: #dbeafe; color: #1d4ed8; }

.cleaner-row__detail {
  grid-column: 1 / -1;
  padding: 0.35rem 0 0.1rem;
  cursor: default;
}
.cleaner-row__detail-text { font-size: 0.72rem; color: var(--ink-700); margin-top: 0.35rem; text-transform: none; }
.heat-strip { display: grid; gap: 2px; }
.heat-strip__cell { height: 10px; border-radius: 2px; background: #efebe4; }
.heat-strip__cell.heat-1 { background: #bfd3f8; }
.heat-strip__cell.heat-2 { background: #6f9ae9; }
.heat-strip__cell.heat-3 { background: var(--accent-700); }

.cleaner-list__empty {
  padding: 1rem 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--ink-500);
}
</style>
