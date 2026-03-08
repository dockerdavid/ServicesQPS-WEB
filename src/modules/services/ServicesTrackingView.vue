<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Button, Message, ProgressSpinner, Tag } from 'primevue';

import BaseLayout from '../../layouts/BaseLayout.vue';
import { CleanersServices } from './services.services';
import type { Service, ServicesDailyTracking } from '../../interfaces/services/services.interface';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

const selectedDate = ref(moment().format('YYYY-MM-DD'));
const tracking = ref<ServicesDailyTracking | null>(null);
const isLoading = ref(false);
const requestError = ref('');

const mapEl = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
let routesLayer: L.LayerGroup | null = null;

const breadcrumbRoutes = [
  { label: 'Services', to: { name: 'services-default' } },
  { label: 'Tracking', to: { name: 'services-tracking' } },
];

const summary = computed(() =>
  tracking.value?.summary ?? {
    totalAssigned: 0,
    started: 0,
    notStarted: 0,
    finished: 0,
  },
);

const services = computed(() => tracking.value?.services ?? []);

const noStartedServices = computed(() =>
  services.value.filter((service) => !service.startedAt),
);

const toCoordinate = (value?: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  return moment(value).format('YYYY-MM-DD HH:mm:ss');
};

const popupHtml = (service: Service, kind: 'start' | 'finish') => {
  const isStart = kind === 'start';
  const latitude = isStart ? service.startLatitude : service.finishLatitude;
  const longitude = isStart ? service.startLongitude : service.finishLongitude;
  const accuracy = isStart ? service.startAccuracy : service.finishAccuracy;
  const timestamp = isStart ? service.startedAt : service.finishedAt;

  return `
    <div style="min-width:220px;font-family:Inter,sans-serif;line-height:1.35;">
      <strong>${service.community?.communityName ?? 'Community'}</strong><br/>
      Unit: ${service.unitNumber ?? '-'}<br/>
      Cleaner: ${service.user?.name ?? '-'}<br/>
      Type: ${service.type?.cleaningType ?? '-'}<br/>
      Status: ${service.status?.statusName ?? '-'}<br/>
      ${isStart ? 'Start' : 'Finish'}: ${formatDateTime(timestamp)}<br/>
      Lat: ${latitude ?? '-'}<br/>
      Lng: ${longitude ?? '-'}<br/>
      Accuracy: ${accuracy ?? '-'}m
    </div>
  `;
};

const drawMap = () => {
  if (!map || !markersLayer || !routesLayer) return;

  markersLayer.clearLayers();
  routesLayer.clearLayers();

  const points: L.LatLngExpression[] = [];

  services.value.forEach((service) => {
    const startLat = toCoordinate(service.startLatitude);
    const startLng = toCoordinate(service.startLongitude);
    const finishLat = toCoordinate(service.finishLatitude);
    const finishLng = toCoordinate(service.finishLongitude);

    if (startLat !== null && startLng !== null) {
      const markerStart = L.circleMarker([startLat, startLng], {
        radius: 7,
        color: '#0f766e',
        fillColor: '#14b8a6',
        fillOpacity: 0.95,
        weight: 2,
      }).bindPopup(popupHtml(service, 'start'));
      markersLayer?.addLayer(markerStart);
      points.push([startLat, startLng]);
    }

    if (finishLat !== null && finishLng !== null) {
      const markerFinish = L.circleMarker([finishLat, finishLng], {
        radius: 7,
        color: '#991b1b',
        fillColor: '#ef4444',
        fillOpacity: 0.95,
        weight: 2,
      }).bindPopup(popupHtml(service, 'finish'));
      markersLayer?.addLayer(markerFinish);
      points.push([finishLat, finishLng]);
    }

    if (
      startLat !== null &&
      startLng !== null &&
      finishLat !== null &&
      finishLng !== null
    ) {
      const route = L.polyline(
        [
          [startLat, startLng],
          [finishLat, finishLng],
        ],
        {
          color: '#2563eb',
          weight: 2,
          opacity: 0.7,
          dashArray: '6, 8',
        },
      );
      routesLayer?.addLayer(route);
    }
  });

  if (points.length === 0) {
    map.setView([28.538335, -81.379234], 10);
    return;
  }

  const bounds = L.latLngBounds(points as L.LatLngBoundsLiteral);
  map.fitBounds(bounds.pad(0.15));
};

const ensureMap = async () => {
  await nextTick();

  if (!mapEl.value || map) return;

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView([28.538335, -81.379234], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  routesLayer = L.layerGroup().addTo(map);
};

const fetchTracking = async () => {
  isLoading.value = true;
  requestError.value = '';

  try {
    tracking.value = await CleanersServices.getDailyTracking(selectedDate.value);
    drawMap();
  } catch (error) {
    requestError.value = 'Unable to load tracking for this date.';
    tracking.value = null;
    drawMap();
  } finally {
    isLoading.value = false;
  }
};

watch(selectedDate, () => {
  fetchTracking();
});

onMounted(async () => {
  await ensureMap();
  await fetchTracking();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <BaseLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>Service Tracking</template>

    <template #header-button>
      <div class="tracking-header">
        <input v-model="selectedDate" type="date" class="tracking-date" />
        <Button label="Refresh" severity="contrast" @click="fetchTracking" />
      </div>
    </template>

    <template #card-content>
      <div class="tracking-wrap">
        <div class="tracking-summary">
          <Tag severity="info" :value="`Assigned: ${summary.totalAssigned}`" />
          <Tag severity="success" :value="`Started: ${summary.started}`" />
          <Tag severity="danger" :value="`No Start: ${summary.notStarted}`" />
          <Tag severity="warn" :value="`Finished: ${summary.finished}`" />
        </div>

        <Message v-if="requestError" severity="error" :closable="false">{{ requestError }}</Message>

        <div class="tracking-map-card">
          <div ref="mapEl" class="tracking-map"></div>
          <div v-if="isLoading" class="tracking-loading">
            <ProgressSpinner stroke-width="4" />
          </div>
        </div>

        <div class="tracking-grid">
          <section class="tracking-panel">
            <h3>Today Missing Start</h3>
            <p v-if="selectedDate !== moment().format('YYYY-MM-DD')" class="tracking-note">
              This panel lists missing starts for {{ selectedDate }}.
            </p>
            <div v-if="noStartedServices.length === 0" class="tracking-empty">No pending start marks.</div>
            <div v-else class="tracking-list">
              <article v-for="service in noStartedServices" :key="service.id" class="tracking-item tracking-item--missing">
                <strong>{{ service.community?.communityName }}</strong>
                <span>Unit {{ service.unitNumber }} · {{ service.type?.cleaningType }}</span>
                <span>Cleaner: {{ service.user?.name || 'Unassigned' }}</span>
                <span>Status: {{ service.status?.statusName }}</span>
              </article>
            </div>
          </section>

          <section class="tracking-panel">
            <h3>Service Timeline</h3>
            <div v-if="services.length === 0" class="tracking-empty">No assigned services for this day.</div>
            <div v-else class="tracking-list">
              <article v-for="service in services" :key="`timeline-${service.id}`" class="tracking-item">
                <strong>{{ service.community?.communityName }} · Unit {{ service.unitNumber }}</strong>
                <span>Cleaner: {{ service.user?.name || '-' }}</span>
                <span>Start: {{ formatDateTime(service.startedAt) }}</span>
                <span>Finish: {{ formatDateTime(service.finishedAt) }}</span>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </BaseLayout>
</template>

<style scoped lang="scss">
.tracking-wrap {
  display: grid;
  gap: 1rem;
}

.tracking-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tracking-date {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 0.6rem;
  padding: 0.55rem 0.8rem;
  font-size: 0.95rem;
}

.tracking-summary {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tracking-map-card {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.12);
  min-height: 420px;
}

.tracking-map {
  width: 100%;
  min-height: 420px;
}

.tracking-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  place-items: center;
}

.tracking-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.tracking-panel {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 0.9rem;
  padding: 1rem;
  background: linear-gradient(150deg, #f8fafc, #ffffff);
}

.tracking-panel h3 {
  font-size: 1rem;
  margin: 0 0 0.6rem;
  color: #0f172a;
}

.tracking-note {
  margin: 0 0 0.6rem;
  color: #64748b;
  font-size: 0.84rem;
}

.tracking-list {
  display: grid;
  gap: 0.65rem;
  max-height: 260px;
  overflow: auto;
}

.tracking-item {
  display: grid;
  gap: 0.15rem;
  padding: 0.75rem;
  border-radius: 0.65rem;
  background: #ffffff;
  border: 1px solid rgba(30, 41, 59, 0.08);
}

.tracking-item span {
  color: #475569;
  font-size: 0.86rem;
}

.tracking-item--missing {
  border-left: 4px solid #ef4444;
}

.tracking-empty {
  color: #64748b;
  font-size: 0.9rem;
}

@media (max-width: 992px) {
  .tracking-grid {
    grid-template-columns: 1fr;
  }
}
</style>
