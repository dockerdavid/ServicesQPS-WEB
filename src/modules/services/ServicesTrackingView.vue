<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import moment from 'moment-timezone';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Message, ProgressSpinner } from 'primevue';

import BaseLayout from '../../layouts/BaseLayout.vue';
import { CleanersServices } from './services.services';
import { CalendarServices } from '../calendar/calendar.services';
import type { Service, ServicesDailyTracking } from '../../interfaces/services/services.interface';

// ── Active tab ───────────────────────────────────────────
type TrackingTab = 'cleaners' | 'qa';
const activeTab = ref<TrackingTab>('cleaners');

// ── QA tracking state ────────────────────────────────────
const qaTracking = ref<any | null>(null);
const isLoadingQA = ref(false);
const requestErrorQA = ref('');
const selectedQAServiceId = ref<string | null>(null);

let qaMap: L.Map | null = null;
let qaMarkersLayer: L.LayerGroup | null = null;
let qaRoutesLayer: L.LayerGroup | null = null;
const qaMapEl = ref<HTMLElement | null>(null);
const qaServiceMarkerRefs = new Map<string, { start: L.Marker | null; finish: L.Marker | null }>();

const qaServices = computed(() => qaTracking.value?.services ?? []);
const qaServiceIndexMap = computed(() => {
  const m = new Map<string, number>();
  qaServices.value.forEach((s: Service, i: number) => m.set(s.id, i + 1));
  return m;
});
const qaSummary = computed(() => qaTracking.value?.summary ?? { totalReviewed: 0, finished: 0, notFinished: 0 });

const DEFAULT_CENTER: L.LatLngExpression = [20, -20];
const DEFAULT_ZOOM = 2;

// Curated palette of 20 vivid, visually distinct colors
const SERVICE_COLORS = [
  '#e11d48', '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#0891b2', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
  '#0284c7', '#65a30d', '#db2777', '#0d9488', '#ca8a04',
  '#4f46e5', '#c026d3', '#15803d', '#b45309', '#1d4ed8',
];

const selectedDate = ref(moment.tz('America/New_York').format('YYYY-MM-DD'));
const tracking = ref<ServicesDailyTracking | null>(null);
const isLoading = ref(false);
const requestError = ref('');
const selectedServiceId = ref<string | null>(null);

const mapEl = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
let routesLayer: L.LayerGroup | null = null;

const serviceMarkerRefs = new Map<string, { start: L.Marker | null; finish: L.Marker | null }>();

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

// 1-based index for each service, correlates map pins with sidebar list
const serviceIndexMap = computed(() => {
  const m = new Map<string, number>();
  services.value.forEach((s, i) => m.set(s.id, i + 1));
  return m;
});

const toCoordinate = (value?: string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const OVERLAP_THRESHOLD_METERS = 2;
const OVERLAP_SEPARATION_METERS = 16;

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceInMeters = (pointA: [number, number], pointB: [number, number]) => {
  const earthRadius = 6371000;
  const dLat = toRadians(pointB[0] - pointA[0]);
  const dLng = toRadians(pointB[1] - pointA[1]);
  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const offsetPointByMeters = (
  point: [number, number],
  northMeters: number,
  eastMeters: number,
): [number, number] => {
  const latRadians = toRadians(point[0]);
  const deltaLat = northMeters / 111320;
  const deltaLng = eastMeters / (111320 * Math.max(Math.cos(latRadians), 0.0001));
  return [point[0] + deltaLat, point[1] + deltaLng];
};

const serviceHash = (serviceId: string) =>
  String(serviceId)
    .split('')
    .reduce((acc, current) => acc + current.charCodeAt(0), 0);

const getServiceColor = (serviceId: string): string =>
  SERVICE_COLORS[serviceHash(serviceId) % SERVICE_COLORS.length];

const getDisplayPoints = (
  serviceId: string,
  startPoint: [number, number],
  finishPoint: [number, number],
) => {
  const distance = distanceInMeters(startPoint, finishPoint);
  if (distance > OVERLAP_THRESHOLD_METERS) {
    return { startDisplayPoint: startPoint, finishDisplayPoint: finishPoint, distance };
  }
  const angle = ((serviceHash(serviceId) % 360) * Math.PI) / 180;
  const halfSep = OVERLAP_SEPARATION_METERS / 2;
  return {
    startDisplayPoint: offsetPointByMeters(startPoint, Math.sin(angle) * halfSep, Math.cos(angle) * halfSep),
    finishDisplayPoint: offsetPointByMeters(finishPoint, -Math.sin(angle) * halfSep, -Math.cos(angle) * halfSep),
    distance,
  };
};

// Group nearby services into clusters and spread them in a circle so every marker is visible
const CLUSTER_RADIUS_METERS = 30;

const separateCloseMarkers = (
  entries: { id: string; point: [number, number] }[],
): Map<string, [number, number]> => {
  const result = new Map<string, [number, number]>();
  const assigned = new Set<string>();

  entries.forEach(({ id, point }) => {
    if (assigned.has(id)) return;
    const cluster: { id: string; point: [number, number] }[] = [{ id, point }];
    assigned.add(id);

    entries.forEach(({ id: id2, point: p2 }) => {
      if (assigned.has(id2)) return;
      if (distanceInMeters(point, p2) <= CLUSTER_RADIUS_METERS) {
        cluster.push({ id: id2, point: p2 });
        assigned.add(id2);
      }
    });

    if (cluster.length === 1) {
      result.set(id, point);
    } else {
      cluster.forEach(({ id: cId }, i) => {
        const angle = (2 * Math.PI * i) / cluster.length;
        result.set(cId, offsetPointByMeters(point, Math.sin(angle) * OVERLAP_SEPARATION_METERS, Math.cos(angle) * OVERLAP_SEPARATION_METERS));
      });
    }
  });

  return result;
};

const isValidTrackPoint = (lat: number | null, lng: number | null) => {
  if (lat === null || lng === null) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'N/A';
  return moment.tz(value, 'America/New_York').format('MM/DD/YYYY hh:mm A');
};

// Start: numbered pin (solid fill)
const createStartIcon = (color: string, index: number): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -42],
    html: `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <filter id="ds${index}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.4"/></filter>
      <path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5C15 36.5 27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#ds${index})"/>
      <text x="15" y="19" text-anchor="middle" dominant-baseline="middle"
        fill="white" font-size="12" font-weight="800" font-family="Inter,system-ui,sans-serif">${index}</text>
    </svg>`,
  });

// Finish: checkmark pin (ring + check, same color)
const createFinishIcon = (color: string, index: number): L.DivIcon =>
  L.divIcon({
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -42],
    html: `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <filter id="df${index}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.4"/></filter>
      <path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5C15 36.5 27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z"
        fill="${color}" stroke="white" stroke-width="2" filter="url(#df${index})"/>
      <circle cx="15" cy="14" r="7.5" fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="1.5"/>
      <path d="M10 14.3 L13.2 17.5 L20 11" stroke="white" stroke-width="2.5"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  });

const popupHtml = (service: Service, kind: 'start' | 'finish', color: string, index: number) => {
  const isStart = kind === 'start';
  const latitude = isStart ? service.startLatitude : service.finishLatitude;
  const longitude = isStart ? service.startLongitude : service.finishLongitude;
  const accuracy = isStart ? service.startAccuracy : service.finishAccuracy;
  const timestamp = isStart ? service.startedAt : service.finishedAt;

  return `
    <div style="min-width:240px;font-family:Inter,system-ui,sans-serif;line-height:1.45;border-radius:6px;overflow:hidden;margin:-1px;">
      <div style="background:${color};padding:0.55rem 0.75rem;display:flex;align-items:center;gap:0.5rem;">
        <span style="background:rgba(255,255,255,0.28);border-radius:50%;width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;font-size:0.76rem;font-weight:800;color:#fff;">${index}</span>
        <span style="color:#fff;font-weight:700;font-size:0.9rem;line-height:1.2;">
          ${isStart ? '▶&nbsp;Start' : '✓&nbsp;Finish'} &mdash; ${service.community?.communityName ?? 'Community'}
        </span>
      </div>
      <div style="padding:0.65rem 0.8rem;background:#fff;display:grid;gap:0.28rem;">
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Unit</span>${service.unitNumber ?? '-'}
        </div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Cleaner</span>${service.user?.name ?? '-'}
        </div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Type</span>${service.type?.cleaningType ?? '-'}
        </div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Status</span>${service.status?.statusName ?? '-'}
        </div>
        <div style="height:1px;background:#f3f4f6;margin:0.3rem 0;"></div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">${isStart ? 'Started' : 'Finished'}</span>${formatDateTime(timestamp)}
        </div>
        <div style="font-size:0.75rem;color:#9ca3af;margin-top:0.1rem;">
          ${latitude ?? '-'}, ${longitude ?? '-'}${accuracy ? ` &bull; ±${accuracy}m` : ''}
        </div>
      </div>
    </div>
  `;
};

const tooltipHtml = (service: Service, kind: 'start' | 'finish', index: number, color: string) => {
  const isStart = kind === 'start';
  return `<span class="trk-tip">
    <span class="trk-tip__dot" style="background:${color};">${index}</span>
    <span class="trk-tip__text">${isStart ? '▶' : '✓'}&nbsp;${service.community?.communityName ?? ''} · Unit ${service.unitNumber ?? '-'}</span>
  </span>`;
};

const drawMap = () => {
  if (!map || !markersLayer || !routesLayer) return;

  markersLayer.clearLayers();
  routesLayer.clearLayers();
  serviceMarkerRefs.clear();

  const points: L.LatLngExpression[] = [];

  const startEntries = services.value
    .filter(s => isValidTrackPoint(toCoordinate(s.startLatitude), toCoordinate(s.startLongitude)))
    .map(s => ({ id: s.id, point: [toCoordinate(s.startLatitude)!, toCoordinate(s.startLongitude)!] as [number, number] }));
  const adjustedStarts = separateCloseMarkers(startEntries);

  services.value.forEach((service) => {
    const startLat = toCoordinate(service.startLatitude);
    const startLng = toCoordinate(service.startLongitude);
    const finishLat = toCoordinate(service.finishLatitude);
    const finishLng = toCoordinate(service.finishLongitude);

    const hasStart = isValidTrackPoint(startLat, startLng);
    const hasFinish = isValidTrackPoint(finishLat, finishLng);
    const startPoint: [number, number] | null = hasStart ? [startLat!, startLng!] : null;
    const finishPoint: [number, number] | null = hasFinish ? [finishLat!, finishLng!] : null;

    const color = getServiceColor(service.id);
    const index = serviceIndexMap.value.get(service.id) ?? 0;
    const refs: { start: L.Marker | null; finish: L.Marker | null } = { start: null, finish: null };

    let startDisplayPoint: [number, number] | null = adjustedStarts.get(service.id) ?? startPoint;
    let finishDisplayPoint = finishPoint;
    let distance = Number.POSITIVE_INFINITY;

    if (startPoint && finishPoint) {
      const dp = getDisplayPoints(service.id, startPoint, finishPoint);
      startDisplayPoint = adjustedStarts.get(service.id) ?? dp.startDisplayPoint;
      finishDisplayPoint = dp.finishDisplayPoint;
      distance = dp.distance;
    }

    if (startDisplayPoint) {
      const m = L.marker(startDisplayPoint, { icon: createStartIcon(color, index) })
        .bindPopup(popupHtml(service, 'start', color, index), { maxWidth: 290, className: 'trk-popup' })
        .bindTooltip(tooltipHtml(service, 'start', index, color), {
          direction: 'top',
          offset: L.point(0, -42),
          className: 'trk-tooltip',
          opacity: 1,
        });
      markersLayer?.addLayer(m);
      refs.start = m;
      points.push(startDisplayPoint);
    }

    if (finishDisplayPoint) {
      const m = L.marker(finishDisplayPoint, { icon: createFinishIcon(color, index) })
        .bindPopup(popupHtml(service, 'finish', color, index), { maxWidth: 290, className: 'trk-popup' })
        .bindTooltip(tooltipHtml(service, 'finish', index, color), {
          direction: 'bottom',
          offset: L.point(0, 10),
          className: 'trk-tooltip',
          opacity: 1,
        });
      markersLayer?.addLayer(m);
      refs.finish = m;
      points.push(finishDisplayPoint);
    }

    // Route line in the service's own color — visually links start ↔ finish
    if (hasStart && hasFinish && distance > OVERLAP_THRESHOLD_METERS) {
      routesLayer?.addLayer(
        L.polyline([startPoint as [number, number], finishPoint as [number, number]], {
          color,
          weight: 2.5,
          opacity: 0.75,
          dashArray: '6 8',
        }),
      );
    }

    serviceMarkerRefs.set(service.id, refs);
  });

  if (points.length === 0) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    return;
  }

  map.fitBounds(L.latLngBounds(points as L.LatLngBoundsLiteral).pad(0.15), { maxZoom: 14 });
};

const focusService = (service: Service) => {
  if (!map) return;
  selectedServiceId.value = service.id;

  const startLat = toCoordinate(service.startLatitude);
  const startLng = toCoordinate(service.startLongitude);
  const finishLat = toCoordinate(service.finishLatitude);
  const finishLng = toCoordinate(service.finishLongitude);

  const hasStart = isValidTrackPoint(startLat, startLng);
  const hasFinish = isValidTrackPoint(finishLat, finishLng);

  const refs = serviceMarkerRefs.get(service.id);

  if (hasStart && hasFinish) {
    map.flyToBounds(
      L.latLngBounds([[startLat!, startLng!], [finishLat!, finishLng!]]).pad(0.35),
      { maxZoom: 16, duration: 0.8 },
    );
  } else if (hasStart) {
    map.flyTo([startLat!, startLng!], 16, { duration: 0.8 });
  } else if (hasFinish) {
    map.flyTo([finishLat!, finishLng!], 16, { duration: 0.8 });
  } else {
    return;
  }

  setTimeout(() => {
    if (refs?.start) refs.start.openPopup();
    else if (refs?.finish) refs.finish.openPopup();
  }, 900);
};

const ensureMap = async () => {
  await nextTick();
  if (!mapEl.value || map) return;

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    minZoom: 3,
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

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
  selectedServiceId.value = null;

  try {
    tracking.value = await CleanersServices.getDailyTracking(selectedDate.value);
    drawMap();
  } catch {
    requestError.value = 'Unable to load tracking for this date.';
    tracking.value = null;
    drawMap();
  } finally {
    isLoading.value = false;
  }
};

watch(selectedDate, () => { fetchTracking(); fetchQATracking(); });

// ── QA map helpers ────────────────────────────────────────
const qaPopupHtml = (service: Service, kind: 'start' | 'finish', color: string, index: number) => {
  const isStart = kind === 'start';
  const latitude  = isStart ? service.qaStartLatitude  : service.qaFinishLatitude;
  const longitude = isStart ? service.qaStartLongitude : service.qaFinishLongitude;
  const accuracy  = isStart ? service.qaStartAccuracy  : service.qaFinishAccuracy;
  const timestamp = isStart ? service.qaStartedAt      : service.qaFinishedAt;

  return `
    <div style="min-width:240px;font-family:Inter,system-ui,sans-serif;line-height:1.45;border-radius:6px;overflow:hidden;margin:-1px;">
      <div style="background:${color};padding:0.55rem 0.75rem;display:flex;align-items:center;gap:0.5rem;">
        <span style="background:rgba(255,255,255,0.28);border-radius:50%;width:24px;height:24px;min-width:24px;display:inline-flex;align-items:center;justify-content:center;font-size:0.76rem;font-weight:800;color:#fff;">${index}</span>
        <span style="color:#fff;font-weight:700;font-size:0.9rem;">
          ${isStart ? '▶&nbsp;QA Start' : '✓&nbsp;QA Finish'} &mdash; ${service.community?.communityName ?? 'Community'}
        </span>
      </div>
      <div style="padding:0.65rem 0.8rem;background:#fff;display:grid;gap:0.28rem;">
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Unit</span>${service.unitNumber ?? '-'}
        </div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Cleaner</span>${service.user?.name ?? '-'}
        </div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">Status</span>${service.status?.statusName ?? '-'}
        </div>
        <div style="height:1px;background:#f3f4f6;margin:0.3rem 0;"></div>
        <div style="font-size:0.83rem;color:#1f2937;display:flex;gap:0.35rem;">
          <span style="color:#6b7280;font-weight:600;min-width:52px;">${isStart ? 'QA Start' : 'QA Finish'}</span>${formatDateTime(timestamp)}
        </div>
        <div style="font-size:0.75rem;color:#9ca3af;margin-top:0.1rem;">
          ${latitude ?? '-'}, ${longitude ?? '-'}${accuracy ? ` &bull; ±${accuracy}m` : ''}
        </div>
      </div>
    </div>`;
};

const drawQAMap = () => {
  if (!qaMap || !qaMarkersLayer || !qaRoutesLayer) return;
  qaMarkersLayer.clearLayers();
  qaRoutesLayer.clearLayers();
  qaServiceMarkerRefs.clear();

  const points: L.LatLngExpression[] = [];

  // Pre-compute separated start positions to avoid stacking markers on the same location
  const startEntries = qaServices.value
    .filter((s: Service) => isValidTrackPoint(toCoordinate(s.qaStartLatitude), toCoordinate(s.qaStartLongitude)))
    .map((s: Service) => ({ id: s.id, point: [toCoordinate(s.qaStartLatitude)!, toCoordinate(s.qaStartLongitude)!] as [number, number] }));
  const adjustedStarts = separateCloseMarkers(startEntries);

  qaServices.value.forEach((service: Service) => {
    const startLat = toCoordinate(service.qaStartLatitude);
    const startLng = toCoordinate(service.qaStartLongitude);
    const finishLat = toCoordinate(service.qaFinishLatitude);
    const finishLng = toCoordinate(service.qaFinishLongitude);

    const hasStart  = isValidTrackPoint(startLat, startLng);
    const hasFinish = isValidTrackPoint(finishLat, finishLng);
    const startPoint: [number, number] | null  = hasStart  ? [startLat!, startLng!]  : null;
    const finishPoint: [number, number] | null = hasFinish ? [finishLat!, finishLng!] : null;


    const color = getServiceColor(service.id);
    const index = qaServiceIndexMap.value.get(service.id) ?? 0;
    const refs: { start: L.Marker | null; finish: L.Marker | null } = { start: null, finish: null };

    let startDisplayPoint: [number, number] | null = adjustedStarts.get(service.id) ?? startPoint;
    let finishDisplayPoint = finishPoint;
    let distance = Number.POSITIVE_INFINITY;

    if (startPoint && finishPoint) {
      const dp = getDisplayPoints(service.id, startPoint, finishPoint);
      startDisplayPoint = adjustedStarts.get(service.id) ?? dp.startDisplayPoint;
      finishDisplayPoint = dp.finishDisplayPoint;
      distance = dp.distance;
    }


    if (startDisplayPoint) {
      const m = L.marker(startDisplayPoint, { icon: createStartIcon(color, index) })
        .bindPopup(qaPopupHtml(service, 'start', color, index), { maxWidth: 290, className: 'trk-popup' })
        .bindTooltip(tooltipHtml(service, 'start', index, color), { direction: 'top', offset: L.point(0, -42), className: 'trk-tooltip', opacity: 1 });
      qaMarkersLayer?.addLayer(m);
      refs.start = m;
      points.push(startDisplayPoint);
    }

    if (finishDisplayPoint) {
      const m = L.marker(finishDisplayPoint, { icon: createFinishIcon(color, index) })
        .bindPopup(qaPopupHtml(service, 'finish', color, index), { maxWidth: 290, className: 'trk-popup' })
        .bindTooltip(tooltipHtml(service, 'finish', index, color), { direction: 'bottom', offset: L.point(0, 10), className: 'trk-tooltip', opacity: 1 });
      qaMarkersLayer?.addLayer(m);
      refs.finish = m;
      points.push(finishDisplayPoint);
    }

    if (hasStart && hasFinish && distance > OVERLAP_THRESHOLD_METERS) {
      qaRoutesLayer?.addLayer(L.polyline(
        [startPoint as [number, number], finishPoint as [number, number]],
        { color, weight: 2.5, opacity: 0.75, dashArray: '6 8' }
      ));
    }

    qaServiceMarkerRefs.set(service.id, refs);
  });

  if (points.length === 0) {
    qaMap.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    return;
  }
  qaMap.fitBounds(L.latLngBounds(points as L.LatLngBoundsLiteral).pad(0.15), { maxZoom: 14 });
};

const focusQAService = (service: Service) => {
  if (!qaMap) return;
  selectedQAServiceId.value = service.id;
  const startLat  = toCoordinate(service.qaStartLatitude);
  const startLng  = toCoordinate(service.qaStartLongitude);
  const finishLat = toCoordinate(service.qaFinishLatitude);
  const finishLng = toCoordinate(service.qaFinishLongitude);
  const hasStart  = isValidTrackPoint(startLat, startLng);
  const hasFinish = isValidTrackPoint(finishLat, finishLng);
  const refs = qaServiceMarkerRefs.get(service.id);

  if (hasStart && hasFinish) {
    qaMap.flyToBounds(L.latLngBounds([[startLat!, startLng!], [finishLat!, finishLng!]]).pad(0.35), { maxZoom: 16, duration: 0.8 });
  } else if (hasStart) {
    qaMap.flyTo([startLat!, startLng!], 16, { duration: 0.8 });
  } else if (hasFinish) {
    qaMap.flyTo([finishLat!, finishLng!], 16, { duration: 0.8 });
  } else return;

  setTimeout(() => {
    if (refs?.start) refs.start.openPopup();
    else if (refs?.finish) refs.finish.openPopup();
  }, 900);
};

const ensureQAMap = async () => {
  await nextTick();
  if (!qaMapEl.value || qaMap) return;
  qaMap = L.map(qaMapEl.value, { zoomControl: true, attributionControl: true, minZoom: 3 }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(qaMap);
  qaMarkersLayer = L.layerGroup().addTo(qaMap);
  qaRoutesLayer  = L.layerGroup().addTo(qaMap);
};

const fetchQATracking = async () => {
  isLoadingQA.value = true;
  requestErrorQA.value = '';
  selectedQAServiceId.value = null;
  try {
    qaTracking.value = await CalendarServices.getQADailyTracking();
    drawQAMap();
  } catch {
    requestErrorQA.value = 'Unable to load QA tracking for today.';
    qaTracking.value = null;
    drawQAMap();
  } finally {
    isLoadingQA.value = false;
  }
};

watch(activeTab, async (tab) => {
  await nextTick();
  // Wait for the browser to reflow after v-show toggle before Leaflet reads dimensions
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  if (tab === 'qa') {
    await ensureQAMap();
    qaMap?.invalidateSize();
    drawQAMap();
  } else {
    map?.invalidateSize();
    drawMap();
  }
});


onMounted(async () => {
  await ensureMap();
  // QA map is NOT initialized here — the tab is hidden (v-show) so Leaflet
  // would get 0×0 dimensions. ensureQAMap() is called when the tab first opens.
  await fetchTracking();
  await fetchQATracking();
});

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null; }
  if (qaMap) { qaMap.remove(); qaMap = null; }
});
</script>

<template>
  <BaseLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>Operational Tracking</template>

    <template #header-button>
      <div class="trk-header">
        <template v-if="activeTab === 'cleaners'">
          <div class="trk-header__group">
            <label for="tracking-date" class="trk-date-label">Service Date</label>
            <input id="tracking-date" v-model="selectedDate" type="date" class="trk-date" />
          </div>
          <Button label="Refresh" severity="contrast" @click="fetchTracking" />
        </template>
        <template v-else>
          <div class="trk-header__group">
            <span class="trk-date-label">QA Activity</span>
            <span class="trk-today-badge">Today</span>
          </div>
          <Button label="Refresh" severity="contrast" @click="fetchQATracking" />
        </template>
      </div>
    </template>

    <template #card-content>
      <div class="trk-wrap">

        <!-- Tab switcher -->
        <div class="trk-tabs">
          <button
            class="trk-tab"
            :class="{ 'trk-tab--active': activeTab === 'cleaners' }"
            @click="activeTab = 'cleaners'"
          >Cleaners</button>
          <button
            class="trk-tab"
            :class="{ 'trk-tab--active': activeTab === 'qa' }"
            @click="activeTab = 'qa'"
          >QA</button>
        </div>

        <!-- ═══ CLEANERS TAB ═══ -->
        <div v-show="activeTab === 'cleaners'">

        <!-- KPI summary row -->
        <div class="trk-summary">
          <article class="kpi-card kpi-card--assigned">
            <span>Assigned</span>
            <strong>{{ summary.totalAssigned }}</strong>
          </article>
          <article class="kpi-card kpi-card--started">
            <span>Started</span>
            <strong>{{ summary.started }}</strong>
          </article>
          <article class="kpi-card kpi-card--missing">
            <span>No Start</span>
            <strong>{{ summary.notStarted }}</strong>
          </article>
          <article class="kpi-card kpi-card--finished">
            <span>Finished</span>
            <strong>{{ summary.finished }}</strong>
          </article>
        </div>

        <Message v-if="requestError" severity="error" :closable="false">{{ requestError }}</Message>

        <!-- Map card -->
        <div class="trk-map-card">

          <!-- Top-left: title -->
          <div class="trk-map-title">
            <h3>Map Overview</h3>
            <span>{{ selectedDate }}</span>
          </div>

          <!-- Top-right: legend -->
          <div class="trk-legend">
            <div class="trk-legend__item">
              <svg width="18" height="22" viewBox="0 0 30 38"><path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5S27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z" fill="#64748b" stroke="white" stroke-width="2"/><text x="15" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="800" font-family="sans-serif">1</text></svg>
              <span>Start (numbered)</span>
            </div>
            <div class="trk-legend__item">
              <svg width="18" height="22" viewBox="0 0 30 38"><path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5S27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z" fill="#64748b" stroke="white" stroke-width="2"/><circle cx="15" cy="14" r="7.5" fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="1.5"/><path d="M10 14.3 L13.2 17.5 L20 11" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Finish (checkmark)</span>
            </div>
            <div class="trk-legend__item trk-legend__item--line">
              <span class="trk-legend__line-sample"></span>
              <span>Same color = same service</span>
            </div>
          </div>

          <div ref="mapEl" class="trk-map"></div>

          <div v-if="isLoading" class="trk-loading">
            <ProgressSpinner stroke-width="4" />
          </div>
        </div>

        <!-- Bottom panels -->
        <div class="trk-grid">

          <!-- Missing start-checkin -->
          <section class="trk-panel">
            <h3>Missing Start Check-in</h3>
            <p v-if="selectedDate !== moment.tz('America/New_York').format('YYYY-MM-DD')" class="trk-note">
              Showing missing starts for {{ selectedDate }}.
            </p>
            <div v-if="noStartedServices.length === 0" class="trk-empty">
              No pending start marks.
            </div>
            <div v-else class="trk-list">
              <article
                v-for="service in noStartedServices"
                :key="service.id"
                class="trk-item trk-item--missing trk-item--clickable"
                :class="{ 'trk-item--active': selectedServiceId === service.id }"
                @click="focusService(service)"
              >
                <div class="trk-item__row">
                  <span
                    class="trk-item__badge"
                    :style="{ background: getServiceColor(service.id) }"
                  >{{ serviceIndexMap.get(service.id) }}</span>
                  <strong>{{ service.community?.communityName }}</strong>
                </div>
                <span>Unit {{ service.unitNumber }} &middot; {{ service.type?.cleaningType }}</span>
                <span>Cleaner: {{ service.user?.name || 'Unassigned' }}</span>
                <span>Status: {{ service.status?.statusName }}</span>
              </article>
            </div>
          </section>

          <!-- Service timeline -->
          <section class="trk-panel">
            <h3>Service Timeline</h3>
            <div v-if="services.length === 0" class="trk-empty">
              No assigned services for this day.
            </div>
            <div v-else class="trk-list">
              <article
                v-for="service in services"
                :key="`tl-${service.id}`"
                class="trk-item trk-item--clickable"
                :class="{ 'trk-item--active': selectedServiceId === service.id }"
                @click="focusService(service)"
              >
                <div class="trk-item__row">
                  <span
                    class="trk-item__badge"
                    :style="{ background: getServiceColor(service.id) }"
                  >{{ serviceIndexMap.get(service.id) }}</span>
                  <strong>{{ service.community?.communityName }} &middot; Unit {{ service.unitNumber }}</strong>
                </div>
                <span>Cleaner: {{ service.user?.name || '-' }}</span>
                <div class="trk-item__times">
                  <span class="trk-item__time trk-item__time--start">
                    ▶ {{ formatDateTime(service.startedAt) }}
                  </span>
                  <span class="trk-item__time trk-item__time--finish">
                    ✓ {{ formatDateTime(service.finishedAt) }}
                  </span>
                </div>
              </article>
            </div>
          </section>

        </div>

        </div>
        <!-- ═══ END CLEANERS TAB ═══ -->

        <!-- ═══ QA TAB ═══ -->
        <div v-show="activeTab === 'qa'">

          <!-- QA KPI row -->
          <div class="trk-summary">
            <article class="kpi-card kpi-card--assigned">
              <span>Reviewed</span>
              <strong>{{ qaSummary.totalReviewed }}</strong>
            </article>
            <article class="kpi-card kpi-card--finished">
              <span>With Finish</span>
              <strong>{{ qaSummary.finished }}</strong>
            </article>
            <article class="kpi-card kpi-card--missing">
              <span>No Finish</span>
              <strong>{{ qaSummary.notFinished }}</strong>
            </article>
          </div>

          <Message v-if="requestErrorQA" severity="error" :closable="false">{{ requestErrorQA }}</Message>

          <!-- QA Map -->
          <div class="trk-map-card">
            <div class="trk-map-title">
              <h3>QA Map Overview</h3>
              <span>Today · {{ moment.tz('America/New_York').format('MM/DD/YYYY') }}</span>
            </div>
            <div class="trk-legend">
              <div class="trk-legend__item">
                <svg width="18" height="22" viewBox="0 0 30 38"><path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5S27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z" fill="#64748b" stroke="white" stroke-width="2"/><text x="15" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12" font-weight="800" font-family="sans-serif">1</text></svg>
                <span>QA Start</span>
              </div>
              <div class="trk-legend__item">
                <svg width="18" height="22" viewBox="0 0 30 38"><path d="M15 1.5C8.1 1.5 2.5 7.1 2.5 14C2.5 22.5 15 36.5 15 36.5S27.5 22.5 27.5 14C27.5 7.1 21.9 1.5 15 1.5Z" fill="#64748b" stroke="white" stroke-width="2"/><circle cx="15" cy="14" r="7.5" fill="rgba(255,255,255,0.18)" stroke="white" stroke-width="1.5"/><path d="M10 14.3 L13.2 17.5 L20 11" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>QA Finish</span>
              </div>
            </div>
            <div ref="qaMapEl" class="trk-map"></div>
            <div v-if="isLoadingQA" class="trk-loading">
              <ProgressSpinner stroke-width="4" />
            </div>
          </div>

          <!-- QA bottom panels -->
          <div class="trk-grid">
            <section class="trk-panel">
              <h3>Servicios Calificados</h3>
              <div v-if="qaServices.length === 0" class="trk-empty">
                No QA visits recorded today.
              </div>
              <div v-else class="trk-list">
                <article
                  v-for="service in qaServices"
                  :key="`qa-${service.id}`"
                  class="trk-item trk-item--clickable"
                  :class="{ 'trk-item--active': selectedQAServiceId === service.id }"
                  @click="focusQAService(service)"
                >
                  <div class="trk-item__row">
                    <span class="trk-item__badge" :style="{ background: getServiceColor(service.id) }">{{ qaServiceIndexMap.get(service.id) }}</span>
                    <strong>{{ service.community?.communityName }} &middot; Unit {{ service.unitNumber }}</strong>
                  </div>
                  <span>Cleaner: {{ service.user?.name || '-' }}</span>
                  <span>Status: {{ service.status?.statusName || '-' }}</span>
                  <div class="trk-item__times">
                    <span class="trk-item__time trk-item__time--start">▶ QA Start: {{ formatDateTime(service.qaStartedAt) }}</span>
                    <span class="trk-item__time trk-item__time--finish">✓ QA Finish: {{ formatDateTime(service.qaFinishedAt) }}</span>
                  </div>
                </article>
              </div>
            </section>

            <section class="trk-panel">
              <h3>Sin Coordenada de Fin QA</h3>
              <div v-if="qaServices.filter((s: any) => !s.qaFinishedAt).length === 0" class="trk-empty">
                Todos los servicios tienen coordenada de fin registrada.
              </div>
              <div v-else class="trk-list">
                <article
                  v-for="service in qaServices.filter((s: any) => !s.qaFinishedAt)"
                  :key="`qanf-${service.id}`"
                  class="trk-item trk-item--missing"
                >
                  <div class="trk-item__row">
                    <span class="trk-item__badge" :style="{ background: getServiceColor(service.id) }">{{ qaServiceIndexMap.get(service.id) }}</span>
                    <strong>{{ service.community?.communityName }} &middot; Unit {{ service.unitNumber }}</strong>
                  </div>
                  <span>Cleaner: {{ service.user?.name || '-' }}</span>
                  <span class="trk-item__time trk-item__time--start">▶ QA Start: {{ formatDateTime(service.qaStartedAt) }}</span>
                </article>
              </div>
            </section>
          </div>

        </div>
        <!-- ═══ END QA TAB ═══ -->

      </div>
    </template>
  </BaseLayout>
</template>

<style scoped lang="scss">
.trk-wrap {
  display: grid;
  gap: 1.1rem;
}

// ── Tabs ────────────────────────────────────────────────
.trk-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid rgba(100, 116, 139, 0.18);
  padding-bottom: 0;
}

.trk-tab {
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;

  &:hover { color: #0f172a; }
}

.trk-tab--active {
  color: #0f172a;
  border-bottom-color: #3b82f6;
}

// ── Header ──────────────────────────────────────────────
.trk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.trk-header__group {
  display: grid;
  gap: 0.35rem;
}

.trk-date-label {
  font-size: 0.78rem;
  color: #475569;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.trk-today-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  background: #0f172a;
  color: #fff;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.trk-date {
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 0.6rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  background: #fff;
}

// ── KPI cards ──────────────────────────────────────────
.trk-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.kpi-card {
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  padding: 0.75rem 0.9rem;
  display: grid;
  gap: 0.2rem;
  background: #f8fafc;

  span {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 600;
  }

  strong {
    color: #0f172a;
    font-size: 1.3rem;
    line-height: 1;
  }
}

.kpi-card--assigned { border-left: 4px solid #3b82f6; }
.kpi-card--started  { border-left: 4px solid #10b981; }
.kpi-card--missing  { border-left: 4px solid #ef4444; }
.kpi-card--finished { border-left: 4px solid #f59e0b; }

// ── Map card ───────────────────────────────────────────
.trk-map-card {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(100, 116, 139, 0.25);
  background: #fff;
}

.trk-map {
  width: 100%;
  height: 500px;
}

.trk-map-title {
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  z-index: 500;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(100, 116, 139, 0.25);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);

  h3 {
    margin: 0;
    font-size: 0.88rem;
    color: #0f172a;
  }

  span {
    font-size: 0.72rem;
    color: #64748b;
  }
}

// ── Legend ─────────────────────────────────────────────
.trk-legend {
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(100, 116, 139, 0.25);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
}

.trk-legend__item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;

  svg {
    flex-shrink: 0;
  }
}

.trk-legend__item--line {
  gap: 0.5rem;
}

.trk-legend__line-sample {
  display: inline-block;
  width: 24px;
  height: 2.5px;
  background: #64748b;
  border-radius: 2px;
  background-image: repeating-linear-gradient(
    to right,
    #64748b 0,
    #64748b 6px,
    transparent 6px,
    transparent 14px
  );
  flex-shrink: 0;
}

.trk-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  place-items: center;
}

// ── Tooltip & Popup (global via :deep) ─────────────────
:deep(.trk-tooltip) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;

  &::before {
    display: none;
  }
}

:deep(.trk-tip) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  border-radius: 999px;
  padding: 0.22rem 0.6rem 0.22rem 0.28rem;
  font-size: 0.73rem;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

:deep(.trk-tip__dot) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

:deep(.trk-tip__text) {
  line-height: 1;
}

:deep(.trk-popup .leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

:deep(.trk-popup .leaflet-popup-content) {
  margin: 0;
}

:deep(.trk-popup .leaflet-popup-tip) {
  background: #fff;
}

// ── Bottom grid panels ─────────────────────────────────
.trk-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.trk-panel {
  border: 1px solid rgba(100, 116, 139, 0.22);
  border-radius: 0.9rem;
  padding: 1rem;
  background: #fff;

  h3 {
    font-size: 1rem;
    margin: 0 0 0.6rem;
    color: #0f172a;
  }
}

.trk-note {
  margin: 0 0 0.6rem;
  color: #64748b;
  font-size: 0.84rem;
}

.trk-list {
  display: grid;
  gap: 0.55rem;
  max-height: 280px;
  overflow: auto;
}

.trk-empty {
  color: #64748b;
  font-size: 0.9rem;
}

// ── Service item cards ─────────────────────────────────
.trk-item {
  display: grid;
  gap: 0.18rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.65rem;
  background: #f8fafc;
  border: 1px solid rgba(100, 116, 139, 0.18);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;

  span {
    color: #475569;
    font-size: 0.84rem;
  }
}

.trk-item--clickable {
  cursor: pointer;

  &:hover {
    background: #f1f5f9;
    border-color: rgba(100, 116, 139, 0.35);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.trk-item--active {
  background: #f0f9ff;
  border-color: rgba(14, 165, 233, 0.4);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.18);
}

.trk-item--missing {
  border-left: 4px solid #ef4444;
}

.trk-item__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.1rem;

  strong {
    font-size: 0.88rem;
    color: #0f172a;
    line-height: 1.3;
  }
}

.trk-item__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 800;
  color: #fff;
  flex-shrink: 0;
}

.trk-item__times {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.15rem;
}

.trk-item__time {
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}

.trk-item__time--start  { color: #059669; }
.trk-item__time--finish { color: #6b7280; }

// ── Responsive ─────────────────────────────────────────
@media (max-width: 992px) {
  .trk-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .trk-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trk-grid {
    grid-template-columns: 1fr;
  }
}
</style>
