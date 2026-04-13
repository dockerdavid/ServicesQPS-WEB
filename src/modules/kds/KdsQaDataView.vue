<template>
    <div class="kds-qa p-4">
        <h2 class="text-2xl font-bold mb-4">KDS</h2>

        <!-- Current week (read-only for QA) -->
        <div class="flex items-center gap-3 mb-6">
            <label class="font-semibold text-sm">Semana:</label>
            <span class="text-sm font-semibold">{{ currentWeekOf }}</span>
            <span class="text-sm text-gray-500">{{ weekLabel }}</span>
            <Button
                icon="pi pi-refresh"
                variant="text"
                severity="secondary"
                @click="loadWeek"
                :loading="isLoading"
            />
        </div>

        <!-- KDS read-only columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="col in columns" :key="col.day" class="kds-column">
                <div class="kds-column-header" :class="`kds-col--${col.day}`">
                    {{ col.label }}
                    <span class="text-xs font-normal ml-1">({{ col.items.length }})</span>
                </div>
                <div class="kds-column-body">
                    <div
                        v-for="(service, index) in col.items"
                        :key="service.id"
                        class="kds-card"
                        @mouseenter="hoveredId = service.id"
                        @mouseleave="hoveredId = null"
                    >
                        <div class="kds-card-order">{{ index + 1 }}</div>
                        <div class="kds-card-body">
                            <p class="font-semibold text-sm truncate">{{ service.community?.communityName || '—' }}</p>
                            <p class="text-xs text-gray-500">Unidad {{ service.unitNumber }} · {{ service.unitySize }}</p>
                            <p class="text-xs text-gray-600">{{ formatDate(service.date) }} {{ service.schedule ? '· ' + service.schedule : '' }}</p>
                            <p class="text-xs text-gray-600 truncate">{{ service.user?.name || 'Sin cleaner' }}</p>
                            <span class="status-badge" :class="statusClass(service.statusId)">{{ service.status?.statusName }}</span>
                        </div>
                        <!-- Hover overlay -->
                        <Transition name="fade">
                            <div v-if="hoveredId === service.id" class="kds-hover-overlay">
                                <button class="details-btn" @click="openDetails(service)">
                                    <i class="pi pi-eye" style="font-size: 0.85rem;"></i>
                                    Ver Detalles
                                </button>
                            </div>
                        </Transition>
                    </div>
                    <div v-if="col.items.length === 0 && !isLoading" class="kds-empty">
                        Sin servicios asignados
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!isLoading && totalAssigned === 0" class="mt-8 text-center text-gray-400">
            No hay servicios organizados por el admin para esta semana.
        </div>

        <ServiceReviewModal
            :visible="modalVisible"
            :service="selectedService"
            @update:visible="modalVisible = $event"
            @review-saved="onReviewSaved"
        />

        <Toast position="bottom-right" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Button, Toast } from 'primevue';
import { useToast } from 'primevue/usetoast';
import moment from 'moment-timezone';
import { KdsServices, type KdsDay } from './kds.services';
import ServiceReviewModal from './components/ServiceReviewModal.vue';
import type { CalendarInterface } from '../../interfaces/calendar/calendar.interface';
import { showToast } from '../../utils/show-toast';

type KdsColumn = { day: KdsDay; label: string; items: CalendarInterface[] };

const toast = useToast();
const isLoading = ref(false);
const hoveredId = ref<string | null>(null);
const modalVisible = ref(false);
const selectedService = ref<CalendarInterface | null>(null);

const currentWeekOf = computed(() => moment().startOf('isoWeek').format('YYYY-MM-DD'));

const columns = ref<KdsColumn[]>([
    { day: 'monday', label: 'LUNES', items: [] },
    { day: 'wednesday', label: 'MIÉRCOLES', items: [] },
    { day: 'friday', label: 'VIERNES', items: [] },
]);

const totalAssigned = computed(() => columns.value.reduce((sum, col) => sum + col.items.length, 0));

const weekLabel = computed(() => {
    const start = moment(currentWeekOf.value);
    const end = start.clone().add(6, 'days');
    return `${start.format('MMM D')} — ${end.format('MMM D, YYYY')}`;
});

async function loadWeek() {
    isLoading.value = true;
    try {
        const result = await KdsServices.getWeekServices(currentWeekOf.value);

        const byDay: Record<KdsDay, CalendarInterface[]> = { monday: [], wednesday: [], friday: [] };
        result.assigned.forEach(s => {
            if (s.kdsDay) byDay[s.kdsDay].push(s);
        });
        (['monday', 'wednesday', 'friday'] as KdsDay[]).forEach(day => {
            byDay[day].sort((a, b) => (a.kdsOrder ?? 0) - (b.kdsOrder ?? 0));
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

function openDetails(service: CalendarInterface) {
    selectedService.value = service;
    modalVisible.value = true;
}

async function onReviewSaved() {
    await loadWeek();
}

function formatDate(date: string | Date): string {
    const str = typeof date === 'string' ? date.substring(0, 10) : date.toISOString().substring(0, 10);
    const [y, m, d] = str.split('-');
    return `${m}/${d}/${y}`;
}

function statusClass(statusId: string | null): string {
    const map: Record<string, string> = {
        '3': 'status--approved',
        '5': 'status--completed',
        '6': 'status--finished',
    };
    return map[statusId ?? ''] ?? '';
}

onMounted(loadWeek);
</script>

<style scoped>
.kds-column {
    display: flex;
    flex-direction: column;
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

.kds-column-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    min-height: 300px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 6px 6px;
}

.kds-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow 0.15s;
    overflow: hidden;
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

.kds-hover-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
}

.details-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #2563eb;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
}

.details-btn:hover { background: #1d4ed8; }

.kds-empty {
    text-align: center;
    color: #94a3b8;
    font-size: 0.75rem;
    padding: 2rem 0;
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
