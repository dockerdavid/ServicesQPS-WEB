<template>
    <div class="kds-admin p-4">
        <h2 class="text-2xl font-bold mb-4">KDS Admin</h2>

        <!-- KDS week + free pool range -->
        <div class="flex flex-wrap items-end gap-3 mb-6">
            <div class="flex flex-col">
                <label for="kds-week" class="font-semibold text-sm mb-1">Semana KDS</label>
                <input
                    id="kds-week"
                    v-model="selectedWeek"
                    type="week"
                    class="border rounded px-3 py-1.5 text-sm w-44"
                />
                <span class="text-xs text-gray-500 mt-1">{{ rangeLabel }}</span>
            </div>
            <div class="flex flex-col">
                <label for="pool-start" class="font-semibold text-sm mb-1">Buscar desde</label>
                <input
                    id="pool-start"
                    v-model="poolStartDate"
                    type="date"
                    class="border rounded px-3 py-1.5 text-sm w-44"
                />
            </div>
            <div class="flex flex-col">
                <label for="pool-end" class="font-semibold text-sm mb-1">Buscar hasta</label>
                <input
                    id="pool-end"
                    v-model="poolEndDate"
                    type="date"
                    class="border rounded px-3 py-1.5 text-sm w-44"
                />
            </div>
            <Button
                label="Aplicar"
                severity="secondary"
                @click="loadRange"
                :disabled="!selectedWeek || !poolStartDate || !poolEndDate || isLoading"
                :loading="isLoading"
            />
            <Button
                icon="pi pi-refresh"
                variant="text"
                severity="secondary"
                @click="loadRange"
                :loading="isLoading"
            />
        </div>

        <div class="flex flex-col lg:flex-row gap-4">
            <!-- LEFT: KDS columns -->
            <div class="lg:w-3/5 flex flex-col gap-2">
                <h3 class="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">KDS — Vista QA</h3>
                <div class="grid grid-cols-3 gap-3">
                    <div v-for="col in columns" :key="col.day" class="kds-column">
                        <div class="kds-column-header" :class="`kds-col--${col.day}`">
                            {{ col.label }}
                            <span class="text-xs font-normal ml-1">({{ col.items.length }})</span>
                        </div>
                        <VueDraggable
                            v-model="col.items"
                            group="services"
                            class="kds-drop-zone"
                            :animation="150"
                            ghost-class="kds-ghost"
                            @end="(evt) => onDropInColumn(evt, col.day)"
                        >
                            <div
                                v-for="(element, index) in col.items"
                                :key="element.id"
                                class="kds-card"
                                :data-id="element.id"
                            >
                                <div class="kds-card-order">{{ index + 1 }}</div>
                                <div class="kds-card-body">
                                    <p class="font-semibold text-sm truncate">{{ element.community?.communityName || '—' }}</p>
                                    <p class="text-xs text-gray-500">Unidad {{ element.unitNumber }} · {{ element.unitySize }}</p>
                                    <p class="text-xs text-gray-600">{{ formatDate(element.date) }} {{ element.schedule ? '· ' + element.schedule : '' }}</p>
                                    <p class="text-xs text-gray-600 truncate">{{ element.user?.name || 'Sin cleaner' }}</p>
                                    <span class="status-badge" :class="statusClass(element.statusId)">{{ element.status?.statusName }}</span>
                                </div>
                                <button class="kds-remove-btn" @click="removeFromKds(element, col.day)" title="Quitar del KDS">×</button>
                            </div>
                        </VueDraggable>
                        <div v-if="col.items.length === 0" class="kds-empty">
                            Arrastra servicios aquí
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: pool -->
            <div class="lg:w-2/5 flex flex-col gap-2">
                <h3 class="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">
                    Servicios para Asignar
                    <span class="text-xs font-normal ml-1">({{ poolTotalCount }} total · {{ withoutKdsPool.length }} sin KDS · {{ limboPool.length }} limbo)</span>
                </h3>
                <div class="text-xs text-gray-500 -mt-1">{{ poolRangeLabel }}</div>
                <div class="pool-tabs">
                    <button
                        class="pool-tab"
                        :class="{ 'pool-tab--active': activePoolTab === 'withoutKds' }"
                        @click="activePoolTab = 'withoutKds'"
                    >
                        Sin KDS ({{ withoutKdsPool.length }})
                    </button>
                    <button
                        class="pool-tab"
                        :class="{ 'pool-tab--active': activePoolTab === 'limbo' }"
                        @click="activePoolTab = 'limbo'"
                    >
                        Limbo ({{ limboPool.length }})
                    </button>
                </div>
                <div class="pool-search mb-2">
                    <input
                        v-model="poolSearch"
                        type="text"
                        placeholder="Buscar por comunidad, unidad o cleaner..."
                        class="border rounded px-3 py-1.5 text-sm w-full"
                    />
                </div>
                <VueDraggable
                    v-model="filteredPool"
                    group="services"
                    class="pool-list"
                    :sort="false"
                    :animation="150"
                    ghost-class="kds-ghost"
                    @end="onDropFromPool"
                >
                    <div
                        v-for="element in filteredPool"
                        :key="element.id"
                        class="pool-card"
                        :data-id="element.id"
                    >
                        <div class="pool-card-body">
                            <div class="flex justify-between items-start">
                                <p class="font-semibold text-sm">{{ element.community?.communityName || '—' }}</p>
                                <div class="flex items-center gap-1.5">
                                    <span v-if="isLimboService(element)" class="limbo-badge">LIMBO</span>
                                    <span v-if="getAssignedBadge(element.id)" class="assigned-badge">
                                        {{ getAssignedBadge(element.id) }}
                                    </span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500">Unidad {{ element.unitNumber }} · {{ element.unitySize }}</p>
                            <p class="text-xs text-gray-600">{{ formatDate(element.date) }} {{ element.schedule ? '· ' + element.schedule : '' }}</p>
                            <p class="text-xs text-gray-600">{{ element.user?.name || 'Sin cleaner' }}</p>
                            <span class="status-badge" :class="statusClass(element.statusId)">{{ element.status?.statusName }}</span>
                        </div>
                    </div>
                </VueDraggable>
                <div v-if="filteredPool.length === 0 && !isLoading" class="pool-empty">
                    {{ poolEmptyMessage }}
                </div>
            </div>
        </div>

        <Toast position="bottom-right" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Button, Toast } from 'primevue';
import { useToast } from 'primevue/usetoast';
import moment from 'moment-timezone';
import { KdsServices, type KdsDay } from './kds.services';
import type { CalendarInterface } from '../../interfaces/calendar/calendar.interface';
import { showToast } from '../../utils/show-toast';

type KdsColumn = { day: KdsDay; label: string; items: CalendarInterface[] };
type PoolTab = 'limbo' | 'withoutKds';

const toast = useToast();
const isLoading = ref(false);

const currentWeekStart = moment().startOf('isoWeek');
const currentWeek = currentWeekStart.format('GGGG-[W]WW');
const selectedWeek = ref<string>(currentWeek);
const poolStartDate = ref<string>(currentWeekStart.format('YYYY-MM-DD'));
const poolEndDate = ref<string>(currentWeekStart.clone().endOf('isoWeek').format('YYYY-MM-DD'));
const rangeServices = ref<CalendarInterface[]>([]);
const poolSearch = ref('');
const activePoolTab = ref<PoolTab>('withoutKds');

const columns = ref<KdsColumn[]>([
    { day: 'monday', label: 'LUNES', items: [] },
    { day: 'wednesday', label: 'MIÉRCOLES', items: [] },
    { day: 'friday', label: 'VIERNES', items: [] },
]);

// All IDs currently in KDS columns
const assignedIds = computed(() => {
    const ids = new Set<string>();
    columns.value.forEach(col => col.items.forEach(s => ids.add(s.id)));
    return ids;
});

const selectedWeekStart = computed(() => isoWeekToMoment(selectedWeek.value));
const limboPool = computed(() =>
    rangeServices.value.filter((service) => !assignedIds.value.has(service.id) && isServiceLimbo(service)),
);
const withoutKdsPool = computed(() =>
    rangeServices.value.filter((service) => !assignedIds.value.has(service.id) && !isServiceLimbo(service) && !service.kdsDay),
);
const poolTotalCount = computed(() => limboPool.value.length + withoutKdsPool.value.length);
const activePoolItems = computed(() => (activePoolTab.value === 'limbo' ? limboPool.value : withoutKdsPool.value));

const filteredPool = ref<CalendarInterface[]>([]);

watch(
    [activePoolItems, poolSearch],
    ([pool, search]) => {
        if (!search.trim()) {
            filteredPool.value = [...pool].sort(sortPoolServices);
            return;
        }
        const q = search.toLowerCase();
        filteredPool.value = pool
            .filter(s =>
                (s.community?.communityName || '').toLowerCase().includes(q) ||
                (s.unitNumber || '').toLowerCase().includes(q) ||
                (s.user?.name || '').toLowerCase().includes(q),
            )
            .sort(sortPoolServices);
    },
    { immediate: true },
);

const rangeLabel = computed(() => {
    const weekStart = isoWeekToMoment(selectedWeek.value);
    if (!weekStart.isValid()) {
        return 'Semana inválida';
    }
    const formattedStart = weekStart.format('MM-DD-YYYY');
    const formattedEnd = weekStart.clone().endOf('isoWeek').format('MM-DD-YYYY');
    return `${formattedStart} — ${formattedEnd}`;
});

const poolRangeLabel = computed(() => {
    const start = moment(poolStartDate.value, 'YYYY-MM-DD', true);
    const end = moment(poolEndDate.value, 'YYYY-MM-DD', true);
    if (!start.isValid() || !end.isValid()) {
        return 'Rango de búsqueda inválido';
    }
    return `Búsqueda: ${start.format('MM-DD-YYYY')} — ${end.format('MM-DD-YYYY')}`;
});

const poolEmptyMessage = computed(() => {
    if (poolSearch.value.trim()) {
        return 'Sin resultados para la búsqueda.';
    }
    return activePoolTab.value === 'limbo'
        ? 'No hay servicios en limbo para el rango seleccionado.'
        : 'No hay servicios sin KDS para el rango seleccionado.';
});

watch(selectedWeek, (value) => {
    if (!value || !isoWeekToMoment(value).isValid()) {
        selectedWeek.value = currentWeek;
    }
});

watch(poolStartDate, (value) => {
    if (!value || !moment(value, 'YYYY-MM-DD', true).isValid()) {
        poolStartDate.value = currentWeekStart.format('YYYY-MM-DD');
    }
});

watch(poolEndDate, (value) => {
    if (!value || !moment(value, 'YYYY-MM-DD', true).isValid()) {
        poolEndDate.value = currentWeekStart.clone().endOf('isoWeek').format('YYYY-MM-DD');
    }
});

async function loadRange() {
    const weekStart = selectedWeekStart.value;
    const rangeStart = moment(poolStartDate.value, 'YYYY-MM-DD', true).startOf('day');
    const rangeEnd = moment(poolEndDate.value, 'YYYY-MM-DD', true).endOf('day');

    if (!weekStart.isValid()) {
        showToast(toast, { severity: 'warn', summary: 'Selecciona una semana válida.' });
        return;
    }
    if (!rangeStart.isValid() || !rangeEnd.isValid()) {
        showToast(toast, { severity: 'warn', summary: 'Selecciona un rango de búsqueda válido.' });
        return;
    }
    if (rangeStart.isAfter(rangeEnd)) {
        showToast(toast, { severity: 'warn', summary: 'El rango de búsqueda es inválido.' });
        return;
    }

    isLoading.value = true;
    try {
        const weekStarts = getWeekStartsBetween(rangeStart, rangeEnd);
        const selectedWeekKey = weekStart.format('YYYY-MM-DD');
        if (!weekStarts.includes(selectedWeekKey)) {
            weekStarts.push(selectedWeekKey);
        }

        const responses = await Promise.all(
            weekStarts.map((weekOf) => KdsServices.getWeekServices(weekOf)),
        );
        const responsesByWeek = new Map<string, (typeof responses)[number]>();
        responses.forEach((response) => {
            const key = moment(response.weekOf, 'YYYY-MM-DD', true).startOf('isoWeek').format('YYYY-MM-DD');
            responsesByWeek.set(key, response);
        });

        const selectedWeekResponse = responsesByWeek.get(selectedWeekKey);
        const selectedWeekServices = selectedWeekResponse
            ? [...selectedWeekResponse.assigned, ...selectedWeekResponse.unassigned]
            : [];

        const byDay: Record<KdsDay, CalendarInterface[]> = { monday: [], wednesday: [], friday: [] };
        selectedWeekServices.forEach((s) => {
            if (s.kdsDay) byDay[s.kdsDay].push(s);
        });
        (['monday', 'wednesday', 'friday'] as KdsDay[]).forEach((day) => {
            byDay[day].sort(sortByDateAndOrder);
        });

        columns.value[0].items = byDay.monday;
        columns.value[1].items = byDay.wednesday;
        columns.value[2].items = byDay.friday;

        const servicesById = new Map<string, CalendarInterface>();
        responses.forEach((response) => {
            [...response.assigned, ...response.unassigned].forEach((service) => {
                const current = servicesById.get(service.id);
                if (!current || (!current.kdsDay && !!service.kdsDay)) {
                    servicesById.set(service.id, service);
                }
            });
        });

        rangeServices.value = [...servicesById.values()]
            .filter((service) => isServiceDateInRange(service, rangeStart, rangeEnd))
            .sort(sortPoolServices);

        if (activePoolTab.value === 'limbo' && limboPool.value.length === 0 && withoutKdsPool.value.length > 0) {
            activePoolTab.value = 'withoutKds';
        }
    } catch {
        showToast(toast, { severity: 'error', summary: 'Error cargando la semana.' });
    } finally {
        isLoading.value = false;
    }
}

async function persistColumn(day: KdsDay) {
    const col = columns.value.find(c => c.day === day);
    if (!col) return;

    const weekStart = selectedWeekStart.value;
    if (!weekStart.isValid()) {
        showToast(toast, { severity: 'warn', summary: 'Semana inválida.' });
        return;
    }

    const localAssignment = new Map<string, { order: number; weekOf: string }>();
    const orderByWeek = new Map<string, number>();

    const saves = col.items.map((service) => {
        const weekOf = getAssignmentWeekOf(weekStart);
        const nextOrder = (orderByWeek.get(weekOf) ?? 0) + 1;
        orderByWeek.set(weekOf, nextOrder);
        localAssignment.set(service.id, { order: nextOrder, weekOf });
        return KdsServices.assignService(service.id, day, nextOrder, weekOf);
    });

    try {
        await Promise.all(saves);
        // Update local state kdsDay/kdsOrder
        col.items.forEach((s) => {
            const assignment = localAssignment.get(s.id);
            if (!assignment) return;
            s.kdsDay = day;
            s.kdsOrder = assignment.order;
            s.kdsWeekOf = assignment.weekOf;
        });
    } catch {
        showToast(toast, { severity: 'error', summary: 'Error guardando el orden. Recargando...' });
        await loadRange();
    }
}

function onDropInColumn(_evt: any, _day: KdsDay) {
    columns.value.forEach((col) => {
        persistColumn(col.day);
    });
}

function onDropFromPool(_evt: any) {
    columns.value.forEach((col) => {
        persistColumn(col.day);
    });
}

async function removeFromKds(service: CalendarInterface, day: KdsDay) {
    const col = columns.value.find(c => c.day === day);
    if (!col) return;
    col.items = col.items.filter(s => s.id !== service.id);
    service.kdsDay = null;
    service.kdsOrder = null;
    service.kdsWeekOf = null;
    try {
        await KdsServices.unassignService(service.id);
        await persistColumn(day); // re-number remaining
    } catch {
        showToast(toast, { severity: 'error', summary: 'Error al quitar el servicio.' });
    }
}

function getAssignedBadge(id: string): string {
    for (const col of columns.value) {
        const idx = col.items.findIndex(s => s.id === id);
        if (idx !== -1) {
            const labelMap: Record<KdsDay, string> = { monday: 'LUN', wednesday: 'MIÉ', friday: 'VIE' };
            return `${labelMap[col.day]} #${idx + 1}`;
        }
    }
    return '';
}

function isLimboService(service: CalendarInterface): boolean {
    return isServiceLimbo(service);
}

function formatDate(date: string | Date): string {
    const str = typeof date === 'string' ? date.substring(0, 10) : date.toISOString().substring(0, 10);
    const [y, m, d] = str.split('-');
    return `${m}-${d}-${y}`;
}

function statusClass(statusId: string | null): string {
    const map: Record<string, string> = {
        '3': 'status--approved',
        '5': 'status--completed',
        '6': 'status--finished',
    };
    return map[statusId ?? ''] ?? '';
}

function isoWeekToMoment(isoWeek: string): moment.Moment {
    return moment(isoWeek, 'GGGG-[W]WW', true).startOf('isoWeek');
}

function getWeekStartsBetween(start: moment.Moment, end: moment.Moment): string[] {
    const result: string[] = [];
    const cursor = start.clone().startOf('isoWeek');
    const boundary = end.clone().endOf('isoWeek');
    while (cursor.isSameOrBefore(boundary, 'day')) {
        result.push(cursor.format('YYYY-MM-DD'));
        cursor.add(1, 'week');
    }
    return result;
}

function getServiceEffectiveWeekOf(service: CalendarInterface): string {
    const kdsWeek = service.kdsWeekOf ? moment(service.kdsWeekOf, 'YYYY-MM-DD', true) : null;
    if (kdsWeek?.isValid()) {
        return kdsWeek.startOf('isoWeek').format('YYYY-MM-DD');
    }

    return moment(service.date).startOf('isoWeek').format('YYYY-MM-DD');
}

function getAssignmentWeekOf(selectedWeekStart: moment.Moment): string {
    return selectedWeekStart.clone().startOf('isoWeek').format('YYYY-MM-DD');
}

function isServiceLimbo(service: CalendarInterface): boolean {
    const effectiveWeek = moment(getServiceEffectiveWeekOf(service), 'YYYY-MM-DD', true);
    const weekStart = selectedWeekStart.value;
    return effectiveWeek.isValid() && weekStart.isValid() && effectiveWeek.isBefore(weekStart, 'day');
}

function isServiceDateInRange(service: CalendarInterface, start: moment.Moment, end: moment.Moment): boolean {
    const serviceDate = moment(service.date);
    return serviceDate.isValid() && serviceDate.isBetween(start, end, 'day', '[]');
}

function sortPoolServices(a: CalendarInterface, b: CalendarInterface): number {
    const aLimbo = isServiceLimbo(a) ? 1 : 0;
    const bLimbo = isServiceLimbo(b) ? 1 : 0;
    if (aLimbo !== bLimbo) {
        return bLimbo - aLimbo;
    }

    const aDate = moment(a.date);
    const bDate = moment(b.date);
    if (!aDate.isSame(bDate, 'day')) {
        return aDate.valueOf() - bDate.valueOf();
    }

    return (a.schedule ?? '').localeCompare(b.schedule ?? '');
}

function sortByDateAndOrder(a: CalendarInterface, b: CalendarInterface): number {
    const aDate = moment(a.date);
    const bDate = moment(b.date);
    if (!aDate.isSame(bDate, 'day')) {
        return aDate.valueOf() - bDate.valueOf();
    }

    const aOrder = a.kdsOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.kdsOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
        return aOrder - bOrder;
    }

    const aSchedule = a.schedule ?? '';
    const bSchedule = b.schedule ?? '';
    return aSchedule.localeCompare(bSchedule);
}

onMounted(loadRange);
</script>

<style scoped>
.kds-column {
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.kds-column-header {
    text-align: center;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    padding: 0.5rem;
    border-radius: 6px 6px 0 0;
    color: white;
}

.kds-col--monday    { background: #2563eb; }
.kds-col--wednesday { background: #7c3aed; }
.kds-col--friday    { background: #059669; }

.kds-drop-zone {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    min-height: 200px;
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-top: none;
    border-radius: 0 0 6px 6px;
}

.kds-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
    cursor: grab;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow 0.15s;
}

.kds-card:hover {
    box-shadow: 0 3px 8px rgba(0,0,0,.12);
}

.kds-card-order {
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e2e8f0;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
}

.kds-card-body {
    flex: 1;
    min-width: 0;
}

.kds-remove-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0 2px;
    flex-shrink: 0;
    line-height: 1;
}

.kds-remove-btn:hover { color: #ef4444; }

.kds-ghost {
    opacity: 0.4;
    background: #dbeafe;
}

.kds-empty {
    text-align: center;
    color: #94a3b8;
    font-size: 0.75rem;
    padding: 1rem 0;
}

.pool-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    padding: 2px;
}

.pool-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    cursor: grab;
    box-shadow: 0 1px 2px rgba(0,0,0,.04);
    transition: box-shadow 0.15s;
}

.pool-card:hover {
    box-shadow: 0 3px 8px rgba(0,0,0,.1);
}

.pool-empty {
    text-align: center;
    color: #94a3b8;
    font-size: 0.8rem;
    padding: 2rem 0;
}

.pool-tabs {
    display: flex;
    gap: 8px;
}

.pool-tab {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 10px;
    cursor: pointer;
}

.pool-tab--active {
    border-color: #3b82f6;
    background: #dbeafe;
    color: #1d4ed8;
}

.limbo-badge {
    font-size: 0.65rem;
    font-weight: 700;
    background: #fee2e2;
    color: #991b1b;
    padding: 1px 6px;
    border-radius: 10px;
    white-space: nowrap;
}

.assigned-badge {
    font-size: 0.65rem;
    font-weight: 700;
    background: #dbeafe;
    color: #1d4ed8;
    padding: 1px 6px;
    border-radius: 10px;
    white-space: nowrap;
}

.status-badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 10px;
    background: #f1f5f9;
    color: #475569;
    margin-top: 4px;
}

.status--approved  { background: #dcfce7; color: #166534; }
.status--completed { background: #f3f4f6; color: #111827; }
.status--finished  { background: #cffafe; color: #164e63; }
</style>
