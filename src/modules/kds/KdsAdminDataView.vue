<template>
    <div class="kds-admin p-4">
        <h2 class="text-2xl font-bold mb-4">KDS Admin</h2>

        <!-- Date range picker -->
        <div class="flex items-center gap-3 mb-6">
            <label class="font-semibold text-sm">Rango:</label>
            <FloatLabel variant="on">
                <Calendar
                    inputId="kds-start-date"
                    v-model="startDate"
                    dateFormat="mm-dd-yy"
                    showIcon
                    iconDisplay="input"
                    class="w-44"
                />
                <label for="kds-start-date">Desde (MM-DD-YYYY)</label>
            </FloatLabel>
            <FloatLabel variant="on">
                <Calendar
                    inputId="kds-end-date"
                    v-model="endDate"
                    dateFormat="mm-dd-yy"
                    showIcon
                    iconDisplay="input"
                    class="w-44"
                />
                <label for="kds-end-date">Hasta (MM-DD-YYYY)</label>
            </FloatLabel>
            <Button
                label="Aplicar"
                severity="secondary"
                @click="loadRange"
                :loading="isLoading"
            />
            <span class="text-sm text-gray-500">{{ rangeLabel }}</span>
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

            <!-- RIGHT: Unassigned pool -->
            <div class="lg:w-2/5 flex flex-col gap-2">
                <h3 class="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">
                    Servicios de la semana
                    <span class="text-xs font-normal ml-1">({{ allServices.length }} total · {{ unassignedPool.length }} sin asignar)</span>
                </h3>
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
                                <span v-if="getAssignedBadge(element.id)" class="assigned-badge">
                                    {{ getAssignedBadge(element.id) }}
                                </span>
                            </div>
                            <p class="text-xs text-gray-500">Unidad {{ element.unitNumber }} · {{ element.unitySize }}</p>
                            <p class="text-xs text-gray-600">{{ formatDate(element.date) }} {{ element.schedule ? '· ' + element.schedule : '' }}</p>
                            <p class="text-xs text-gray-600">{{ element.user?.name || 'Sin cleaner' }}</p>
                            <span class="status-badge" :class="statusClass(element.statusId)">{{ element.status?.statusName }}</span>
                        </div>
                    </div>
                </VueDraggable>
                <div v-if="filteredPool.length === 0 && !isLoading" class="pool-empty">
                    {{ poolSearch ? 'Sin resultados para la búsqueda.' : 'Todos los servicios están asignados al KDS.' }}
                </div>
            </div>
        </div>

        <Toast position="bottom-right" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Button, Toast, Calendar, FloatLabel } from 'primevue';
import { useToast } from 'primevue/usetoast';
import moment from 'moment-timezone';
import { KdsServices, type KdsDay } from './kds.services';
import type { CalendarInterface } from '../../interfaces/calendar/calendar.interface';
import { showToast } from '../../utils/show-toast';

type KdsColumn = { day: KdsDay; label: string; items: CalendarInterface[] };

const toast = useToast();
const isLoading = ref(false);

// Default date range: current week (Monday-Sunday)
const currentWeek = getCurrentWeekRange(new Date());
const startDate = ref<Date>(currentWeek.start);
const endDate = ref<Date>(currentWeek.end);
const allServices = ref<CalendarInterface[]>([]);
const poolSearch = ref('');

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

// Unassigned pool (not in any column)
const unassignedPool = computed(() =>
    allServices.value.filter(s => !assignedIds.value.has(s.id))
);

// VueDraggable needs a mutable ref — keep it in sync with unassignedPool via watch
const filteredPool = ref<CalendarInterface[]>([]);

watch(
    [unassignedPool, poolSearch],
    ([pool, search]) => {
        if (!search.trim()) {
            filteredPool.value = [...pool];
            return;
        }
        const q = search.toLowerCase();
        filteredPool.value = pool.filter(s =>
            (s.community?.communityName || '').toLowerCase().includes(q) ||
            (s.unitNumber || '').toLowerCase().includes(q) ||
            (s.user?.name || '').toLowerCase().includes(q)
        );
    },
    { immediate: true },
);

const rangeLabel = computed(() => {
    const start = moment(startDate.value).format('MM-DD-YYYY');
    const end = moment(endDate.value).format('MM-DD-YYYY');
    return `${start} — ${end}`;
});

async function loadRange() {
    const rangeStart = moment(startDate.value).startOf('day');
    const rangeEnd = moment(endDate.value).startOf('day');
    if (rangeStart.isAfter(rangeEnd)) {
        showToast(toast, { severity: 'warn', summary: 'El rango de fechas es inválido.' });
        return;
    }

    isLoading.value = true;
    try {
        const weekStarts = getWeekStartsBetween(rangeStart, rangeEnd);
        const weekResponses = await Promise.all(
            weekStarts.map((weekOf) => KdsServices.getWeekServices(weekOf)),
        );

        const servicesById = new Map<string, CalendarInterface>();
        weekResponses.forEach((response) => {
            [...response.assigned, ...response.unassigned].forEach((service) => {
                const current = servicesById.get(service.id);
                if (!current || (!current.kdsDay && !!service.kdsDay)) {
                    servicesById.set(service.id, service);
                }
            });
        });

        const inRangeServices = [...servicesById.values()].filter((service) =>
            isServiceInRange(service.date, rangeStart, rangeEnd),
        );
        allServices.value = inRangeServices;

        const byDay: Record<KdsDay, CalendarInterface[]> = { monday: [], wednesday: [], friday: [] };
        inRangeServices.forEach((s) => {
            if (s.kdsDay) byDay[s.kdsDay].push(s);
        });
        (['monday', 'wednesday', 'friday'] as KdsDay[]).forEach((day) => {
            byDay[day].sort(sortByDateAndOrder);
        });

        columns.value[0].items = byDay.monday;
        columns.value[1].items = byDay.wednesday;
        columns.value[2].items = byDay.friday;
    } catch {
        showToast(toast, { severity: 'error', summary: 'Error cargando la semana.' });
    } finally {
        isLoading.value = false;
    }
}

async function persistColumn(day: KdsDay) {
    const col = columns.value.find(c => c.day === day);
    if (!col) return;

    const localAssignment = new Map<string, { order: number; weekOf: string }>();
    const orderByWeek = new Map<string, number>();

    const saves = col.items.map((service) => {
        const weekOf = getServiceWeekOf(service.date);
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

function getCurrentWeekRange(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(0, 0, 0, 0);

    return { start: monday, end: sunday };
}

function getWeekStartsBetween(start: moment.Moment, end: moment.Moment): string[] {
    const result: string[] = [];
    const cursor = start.clone().startOf('isoWeek');
    const boundary = end.clone().endOf('day');

    while (cursor.isSameOrBefore(boundary, 'day')) {
        result.push(cursor.format('YYYY-MM-DD'));
        cursor.add(1, 'week');
    }

    return result;
}

function getServiceWeekOf(date: string | Date): string {
    const serviceDate = typeof date === 'string' ? date.substring(0, 10) : date.toISOString().substring(0, 10);
    return moment(serviceDate, 'YYYY-MM-DD').startOf('isoWeek').format('YYYY-MM-DD');
}

function isServiceInRange(
    serviceDate: string | Date,
    start: moment.Moment,
    end: moment.Moment,
): boolean {
    const value = typeof serviceDate === 'string' ? serviceDate.substring(0, 10) : serviceDate.toISOString().substring(0, 10);
    const target = moment(value, 'YYYY-MM-DD', true);
    return target.isValid() && target.isBetween(start, end, 'day', '[]');
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
