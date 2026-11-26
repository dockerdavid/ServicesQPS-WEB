<template>
  <section class="wz">
    <header class="wz__header">
      <div>
        <h2 class="wz__title"><i class="pi pi-map" /> Zona de trabajo</h2>
        <p class="wz__subtitle">
          Dónde puede trabajar esta cleaner. Se combinan: comunidades, compañías y/o áreas dibujadas en el mapa.
        </p>
      </div>
      <Tag v-if="loaded" :severity="hasZone ? 'success' : 'warn'" :value="hasZone ? 'Con zona' : 'Sin zona'" />
    </header>

    <Message v-if="status && !status.enforced" severity="warn" class="wz__notice">
      Desde el {{ enforceLabel }} solo aparecerán las cleaners con zona asignada.
      Hasta entonces se siguen mostrando todas al asignar servicios.
    </Message>
    <Message v-else-if="status?.enforced && loaded && !hasZone" severity="error" class="wz__notice">
      Esta cleaner no tiene zona asignada: no aparece al asignar servicios.
    </Message>

    <div class="wz__selects">
      <fieldset>
        <label for="wz-communities">Comunidades</label>
        <MultiSelect
          v-model="selectedCommunityIds"
          inputId="wz-communities"
          :options="communityOptions"
          optionLabel="label"
          optionValue="value"
          filter
          display="chip"
          :maxSelectedLabels="6"
          placeholder="Ninguna"
          class="w-full"
        />
      </fieldset>
      <fieldset>
        <label for="wz-companies">Compañías <small>(todas sus comunidades)</small></label>
        <MultiSelect
          v-model="selectedCompanyIds"
          inputId="wz-companies"
          :options="companyOptions"
          optionLabel="label"
          optionValue="value"
          filter
          display="chip"
          :maxSelectedLabels="6"
          placeholder="Ninguna"
          class="w-full"
        />
      </fieldset>
    </div>

    <div class="wz__toolbar">
      <span class="wz__toolbar-label">Geocerca libre:</span>
      <Button
        size="small"
        icon="pi pi-pencil"
        label="Dibujar a mano alzada"
        :severity="mode === 'freehand' ? 'primary' : 'secondary'"
        :outlined="mode !== 'freehand'"
        @click="setMode(mode === 'freehand' ? 'idle' : 'freehand')"
      />
      <Button
        size="small"
        icon="pi pi-share-alt"
        label="Dibujar por puntos"
        :severity="mode === 'points' ? 'primary' : 'secondary'"
        :outlined="mode !== 'points'"
        @click="setMode(mode === 'points' ? 'idle' : 'points')"
      />
      <Button
        v-if="mode === 'points'"
        size="small"
        icon="pi pi-check"
        label="Cerrar polígono"
        severity="success"
        :disabled="draftPoints.length < 3"
        @click="finishPointsPolygon"
      />
      <Button
        size="small"
        icon="pi pi-arrows-alt"
        label="Editar vértices"
        :severity="mode === 'edit' ? 'primary' : 'secondary'"
        :outlined="mode !== 'edit'"
        :disabled="selectedPolygonId === null"
        @click="setMode(mode === 'edit' ? 'idle' : 'edit')"
      />
      <Button
        size="small"
        icon="pi pi-trash"
        label="Eliminar polígono"
        severity="danger"
        outlined
        :disabled="selectedPolygonId === null"
        @click="deleteSelectedPolygon"
      />
    </div>
    <p class="wz__help">{{ helpText }}</p>

    <!-- La clase dinámica va en un wrapper: Vue reescribe el atributo class del
         elemento con :class y borraría las clases que Leaflet pone en su contenedor
         (leaflet-container…), y el mapa de fondo dejaba de verse al dibujar. -->
    <div :class="{ 'wz__map-wrap--drawing': mode === 'freehand' || mode === 'points' }">
      <div ref="mapContainer" class="wz__map"></div>
    </div>

    <div class="wz__legend">
      <span><i class="wz__dot wz__dot--in" /> Dentro de su zona</span>
      <span><i class="wz__dot wz__dot--out" /> Fuera de su zona</span>
      <span>{{ polygonCount }} polígono(s)</span>
      <span>
        <b>{{ coveredCount }}</b> de {{ communities.length }} comunidades cubiertas
        <template v-if="withoutCoordsCount">
          · {{ withoutCoordsCount }} sin ubicación (solo cuentan si se eligen arriba)
        </template>
      </span>
    </div>

    <div class="wz__actions">
      <Button label="Guardar zona de trabajo" icon="pi pi-save" :loading="saving" :disabled="!loaded" @click="save" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Message, MultiSelect, Tag, useToast } from 'primevue';

import { showToast } from '../../../utils/show-toast';
import { CommunitiesServices } from '../../communities/communities.services';
import { CompaniesServices } from '../../companies/companies.services';
import {
  CleanerZonesServices,
  formatEnforceFrom,
  type CleanerZoneStatus,
  type ZoneFeatureCollection,
} from '../cleaner-zones.services';
import { isCommunityCovered, toCoord, type LngLat, type ZoneCommunity } from '../zone-geometry';

const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ (e: 'saved', hasWorkZone: boolean): void }>();

type Mode = 'idle' | 'freehand' | 'points' | 'edit';

interface CommunityRow extends ZoneCommunity {
  name: string;
}

interface DrawnPolygon {
  id: number;
  latlngs: L.LatLng[];
  layer: L.Polygon;
}

const toast = useToast();
const mapContainer = ref<HTMLElement | null>(null);

const loaded = ref(false);
const saving = ref(false);
const status = ref<CleanerZoneStatus | null>(null);
const communities = ref<CommunityRow[]>([]);
const companies = ref<{ id: string; name: string }[]>([]);
const selectedCommunityIds = ref<string[]>([]);
const selectedCompanyIds = ref<string[]>([]);

const mode = ref<Mode>('idle');
const polygons = shallowRef<DrawnPolygon[]>([]);
const selectedPolygonId = ref<number | null>(null);
const draftPoints = ref<L.LatLng[]>([]);
let nextPolygonId = 1;

const CENTRO_POR_DEFECTO: L.LatLngExpression = [28.5383, -81.3792];
const COLOR_POLYGON = '#2563eb';
const COLOR_SELECTED = '#f59e0b';

let map: L.Map | null = null;
let communityLayer: L.LayerGroup | null = null;
let editLayer: L.LayerGroup | null = null;
let draftLayer: L.Polyline | null = null;
let freehandPoints: L.LatLng[] = [];
let freehandActive = false;
// Al soltar el trazo Leaflet dispara un click: no debe deseleccionar el poligono nuevo.
let suppressNextClick = false;

const enforceLabel = computed(() => formatEnforceFrom(status.value?.enforceFrom));
const polygonCount = computed(() => polygons.value.length);

const hasZone = computed(() =>
  selectedCommunityIds.value.length > 0 || selectedCompanyIds.value.length > 0 || polygons.value.length > 0,
);

const communityOptions = computed(() =>
  communities.value.map((c) => ({ label: c.name, value: c.id })),
);
const companyOptions = computed(() => companies.value.map((c) => ({ label: c.name, value: c.id })));

const rings = computed<LngLat[][]>(() =>
  polygons.value.map((p) => p.latlngs.map((ll) => [ll.lng, ll.lat] as LngLat)),
);

const coverage = computed(() => {
  const communitySet = new Set(selectedCommunityIds.value);
  const companySet = new Set(selectedCompanyIds.value);
  const map = new Map<string, ReturnType<typeof isCommunityCovered>>();
  communities.value.forEach((c) => map.set(c.id, isCommunityCovered(c, communitySet, companySet, rings.value)));
  return map;
});

const coveredCount = computed(() => [...coverage.value.values()].filter(Boolean).length);
const withoutCoordsCount = computed(() => communities.value.filter((c) => c.lat === null || c.lng === null).length);

const helpText = computed(() => {
  switch (mode.value) {
    case 'freehand':
      return 'Mantén presionado y arrastra sobre el mapa para trazar el área. Al soltar se cierra el polígono.';
    case 'points':
      return 'Haz clic para ir poniendo vértices. Doble clic o «Cerrar polígono» para terminar. Esc cancela.';
    case 'edit':
      return 'Arrastra los vértices para ajustar. Clic en un «+» agrega un vértice; doble clic en un vértice lo quita.';
    default:
      return 'Haz clic en un polígono para seleccionarlo (editar o eliminar). Los puntos son las comunidades con ubicación.';
  }
});

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

const loadAllCommunities = async () => {
  let all: any[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 40) {
    const response = await CommunitiesServices.getCommunities(page, 50);
    all = [...all, ...response.data];
    hasNext = Boolean(response.meta?.hasNextPage);
    page++;
  }
  return all;
};

const loadAllCompanies = async () => {
  let all: any[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 40) {
    const response = await CompaniesServices.getCompanies(page, 50);
    all = [...all, ...response.data];
    hasNext = Boolean(response.meta?.hasNextPage);
    page++;
  }
  return all;
};

const load = async () => {
  try {
    const [zone, allCommunities, allCompanies] = await Promise.all([
      CleanerZonesServices.getWorkZone(props.userId),
      loadAllCommunities(),
      loadAllCompanies(),
    ]);
    status.value = { enforced: zone.enforced, enforceFrom: zone.enforceFrom };
    communities.value = allCommunities
      .map((c: any) => ({
        id: String(c.id),
        name: c.communityName,
        companyId: c.company?.id ? String(c.company.id) : (c.companyId ? String(c.companyId) : null),
        lat: toCoord(c.latitude),
        lng: toCoord(c.longitude),
      }))
      .map((c) => (c.lat === 0 && c.lng === 0 ? { ...c, lat: null, lng: null } : c))
      .sort((a, b) => a.name.localeCompare(b.name));
    companies.value = allCompanies
      .map((c: any) => ({ id: String(c.id), name: c.companyName }))
      .sort((a, b) => a.name.localeCompare(b.name));
    selectedCommunityIds.value = zone.communityIds.map(String);
    selectedCompanyIds.value = zone.companyIds.map(String);
    loadPolygons(zone.zones);
    loaded.value = true;
    drawCommunities();
    fitToContent();
  } catch {
    showToast(toast, { severity: 'error', summary: 'No se pudo cargar la zona de trabajo' });
  }
};

const loadPolygons = (zones: ZoneFeatureCollection | null | undefined) => {
  polygons.value.forEach((p) => p.layer.remove());
  const next: DrawnPolygon[] = [];
  (zones?.features ?? []).forEach((feature) => {
    const geometry = feature.geometry;
    const outerRings: number[][][] = geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);
    outerRings.forEach((ring) => {
      if (!ring || ring.length < 4) return;
      // GeoJSON repite el primer punto al final; Leaflet no lo necesita.
      const latlngs = ring.slice(0, -1).map(([lng, lat]) => L.latLng(lat, lng));
      next.push(createPolygon(latlngs));
    });
  });
  polygons.value = next;
};

// ---------------------------------------------------------------------------
// Poligonos
// ---------------------------------------------------------------------------

const createPolygon = (latlngs: L.LatLng[]): DrawnPolygon => {
  const id = nextPolygonId++;
  const layer = L.polygon(latlngs, { color: COLOR_POLYGON, weight: 2, fillOpacity: 0.15 });
  const polygon: DrawnPolygon = { id, latlngs, layer };
  layer.on('click', (e: L.LeafletMouseEvent) => {
    if (mode.value === 'freehand' || mode.value === 'points') return;
    L.DomEvent.stopPropagation(e);
    selectPolygon(id);
  });
  if (map) layer.addTo(map);
  return polygon;
};

const addPolygon = (latlngs: L.LatLng[]) => {
  if (latlngs.length < 3) return;
  const polygon = createPolygon(latlngs);
  polygons.value = [...polygons.value, polygon];
  selectPolygon(polygon.id);
};

const selectPolygon = (id: number | null) => {
  selectedPolygonId.value = id;
  polygons.value.forEach((p) => p.layer.setStyle({ color: p.id === id ? COLOR_SELECTED : COLOR_POLYGON }));
  if (mode.value === 'edit') renderEditHandles();
};

const deleteSelectedPolygon = () => {
  const id = selectedPolygonId.value;
  if (id === null) return;
  const target = polygons.value.find((p) => p.id === id);
  target?.layer.remove();
  polygons.value = polygons.value.filter((p) => p.id !== id);
  selectedPolygonId.value = null;
  if (mode.value === 'edit') setMode('idle');
};

const touchPolygon = (polygon: DrawnPolygon) => {
  polygon.layer.setLatLngs(polygon.latlngs);
  // shallowRef: se reasigna para que la cobertura se recalcule.
  polygons.value = [...polygons.value];
};

const renderEditHandles = () => {
  editLayer?.clearLayers();
  if (!map || mode.value !== 'edit') return;
  const polygon = polygons.value.find((p) => p.id === selectedPolygonId.value);
  if (!polygon) return;
  if (!editLayer) editLayer = L.layerGroup().addTo(map);

  const vertexIcon = L.divIcon({ className: 'wz-vertex', iconSize: [12, 12] });
  const midIcon = L.divIcon({ className: 'wz-midpoint', html: '+', iconSize: [14, 14] });

  polygon.latlngs.forEach((latlng, index) => {
    const marker = L.marker(latlng, { icon: vertexIcon, draggable: true }).addTo(editLayer!);
    marker.on('drag', () => {
      polygon.latlngs[index] = marker.getLatLng();
      polygon.layer.setLatLngs(polygon.latlngs);
    });
    marker.on('dragend', () => {
      touchPolygon(polygon);
      renderEditHandles();
    });
    marker.on('dblclick', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if (polygon.latlngs.length <= 3) return;
      polygon.latlngs.splice(index, 1);
      touchPolygon(polygon);
      renderEditHandles();
    });

    const next = polygon.latlngs[(index + 1) % polygon.latlngs.length];
    const mid = L.latLng((latlng.lat + next.lat) / 2, (latlng.lng + next.lng) / 2);
    const midMarker = L.marker(mid, { icon: midIcon }).addTo(editLayer!);
    midMarker.on('click', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      polygon.latlngs.splice(index + 1, 0, mid);
      touchPolygon(polygon);
      renderEditHandles();
    });
  });
};

// ---------------------------------------------------------------------------
// Modos de dibujo
// ---------------------------------------------------------------------------

const clearDraft = () => {
  draftPoints.value = [];
  freehandPoints = [];
  freehandActive = false;
  draftLayer?.remove();
  draftLayer = null;
};

const setMode = (next: Mode) => {
  clearDraft();
  mode.value = next;
  if (!map) return;
  if (next === 'freehand') {
    map.dragging.disable();
    map.doubleClickZoom.disable();
  } else if (next === 'points') {
    map.dragging.enable();
    map.doubleClickZoom.disable();
  } else {
    map.dragging.enable();
    map.doubleClickZoom.enable();
  }
  if (next === 'edit') renderEditHandles();
  else editLayer?.clearLayers();
};

const updateDraftLine = (points: L.LatLng[]) => {
  if (!map) return;
  if (!draftLayer) {
    draftLayer = L.polyline(points, { color: COLOR_SELECTED, weight: 2, dashArray: '4 4' }).addTo(map);
  } else {
    draftLayer.setLatLngs(points);
  }
};

const finishPointsPolygon = () => {
  const points = [...draftPoints.value];
  clearDraft();
  if (points.length >= 3) addPolygon(points);
  setMode('idle');
};

/** Simplifica el trazo a mano alzada (Douglas-Peucker en pixeles de pantalla). */
const simplifyFreehand = (points: L.LatLng[]) => {
  if (!map || points.length < 3) return points;
  const projected = points.map((p) => map!.latLngToLayerPoint(p));
  const simplified = L.LineUtil.simplify(projected, 3);
  return simplified.map((p) => map!.layerPointToLatLng(p));
};

const pointerToLatLng = (event: PointerEvent) => {
  const rect = mapContainer.value!.getBoundingClientRect();
  return map!.containerPointToLatLng(L.point(event.clientX - rect.left, event.clientY - rect.top));
};

const onPointerDown = (event: PointerEvent) => {
  if (mode.value !== 'freehand' || !map) return;
  freehandActive = true;
  freehandPoints = [pointerToLatLng(event)];
  mapContainer.value?.setPointerCapture?.(event.pointerId);
  event.preventDefault();
};

const onPointerMove = (event: PointerEvent) => {
  if (!freehandActive || !map) return;
  const latlng = pointerToLatLng(event);
  const last = freehandPoints[freehandPoints.length - 1];
  if (last && map.latLngToContainerPoint(last).distanceTo(map.latLngToContainerPoint(latlng)) < 4) return;
  freehandPoints.push(latlng);
  updateDraftLine(freehandPoints);
};

const onPointerUp = (event: PointerEvent) => {
  if (!freehandActive) return;
  mapContainer.value?.releasePointerCapture?.(event.pointerId);
  const points = simplifyFreehand(freehandPoints);
  clearDraft();
  suppressNextClick = true;
  setTimeout(() => { suppressNextClick = false; }, 300);
  if (points.length >= 3) {
    addPolygon(points);
    setMode('idle');
  } else {
    showToast(toast, { severity: 'warn', summary: 'Trazo muy corto', detail: 'Arrastra rodeando el área que quieres marcar.' });
  }
};

const onMapClick = (e: L.LeafletMouseEvent) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  if (mode.value === 'points') {
    const last = draftPoints.value[draftPoints.value.length - 1];
    // El doble clic de cierre dispara dos clicks en el mismo sitio: no duplicar el vertice.
    if (last && map && map.latLngToContainerPoint(last).distanceTo(e.containerPoint) < 5) return;
    draftPoints.value = [...draftPoints.value, e.latlng];
    updateDraftLine(draftPoints.value);
    return;
  }
  if (mode.value === 'idle') selectPolygon(null);
};

const onMapDblClick = () => {
  if (mode.value === 'points' && draftPoints.value.length >= 3) finishPointsPolygon();
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && mode.value !== 'idle') setMode('idle');
};

// ---------------------------------------------------------------------------
// Comunidades en el mapa
// ---------------------------------------------------------------------------

const drawCommunities = () => {
  if (!map) return;
  if (!communityLayer) communityLayer = L.layerGroup().addTo(map);
  communityLayer.clearLayers();
  communities.value.forEach((c) => {
    if (c.lat === null || c.lng === null) return;
    const covered = coverage.value.get(c.id);
    const marker = L.circleMarker([c.lat, c.lng], {
      radius: 6,
      weight: 2,
      color: '#fff',
      fillColor: covered ? '#16a34a' : '#94a3b8',
      fillOpacity: 0.95,
      // No deben robar los clics al dibujar.
      interactive: mode.value === 'idle' || mode.value === 'edit',
    });
    const reason = covered === 'community'
      ? ' (comunidad elegida)'
      : covered === 'company' ? ' (por su compañía)' : covered === 'zone' ? ' (dentro de la geocerca)' : '';
    marker.bindTooltip(`${c.name}${reason}`);
    marker.addTo(communityLayer!);
  });
};

const fitToContent = () => {
  if (!map) return;
  const bounds = L.latLngBounds([]);
  polygons.value.forEach((p) => bounds.extend(p.layer.getBounds()));
  if (!bounds.isValid()) {
    communities.value.forEach((c) => {
      if (c.lat !== null && c.lng !== null) bounds.extend([c.lat, c.lng]);
    });
  }
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
};

watch([coverage, mode], drawCommunities);

// ---------------------------------------------------------------------------
// Guardar
// ---------------------------------------------------------------------------

const toFeatureCollection = (): ZoneFeatureCollection | null => {
  if (!polygons.value.length) return null;
  return {
    type: 'FeatureCollection',
    features: polygons.value.map((p): ZoneFeatureCollection['features'][number] => {
      const ring = p.latlngs.map((ll) => [Number(ll.lng.toFixed(6)), Number(ll.lat.toFixed(6))]);
      ring.push([...ring[0]]);
      return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
    }),
  };
};

const save = async () => {
  saving.value = true;
  try {
    const result = await CleanerZonesServices.updateWorkZone(props.userId, {
      communityIds: selectedCommunityIds.value,
      companyIds: selectedCompanyIds.value,
      zones: toFeatureCollection(),
    });
    showToast(toast, {
      severity: 'success',
      summary: 'Zona de trabajo guardada',
      detail: result.hasWorkZone ? `${coveredCount.value} comunidades cubiertas.` : 'La cleaner quedó sin zona.',
    });
    emit('saved', result.hasWorkZone);
  } catch (error: any) {
    showToast(toast, {
      severity: 'error',
      summary: 'No se pudo guardar la zona',
      detail: error?.response?.data?.message ?? error?.message,
    });
  } finally {
    saving.value = false;
  }
};

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

onMounted(async () => {
  await nextTick();
  if (mapContainer.value) {
    map = L.map(mapContainer.value).setView(CENTRO_POR_DEFECTO, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', onMapClick);
    map.on('dblclick', onMapDblClick);
    mapContainer.value.addEventListener('pointerdown', onPointerDown);
    mapContainer.value.addEventListener('pointermove', onPointerMove);
    mapContainer.value.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    // Igual que MyMapPicker: el contenedor puede montarse animandose.
    setTimeout(() => map?.invalidateSize(), 250);
  }
  await load();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  mapContainer.value?.removeEventListener('pointerdown', onPointerDown);
  mapContainer.value?.removeEventListener('pointermove', onPointerMove);
  mapContainer.value?.removeEventListener('pointerup', onPointerUp);
  map?.remove();
  map = null;
  communityLayer = null;
  editLayer = null;
  draftLayer = null;
});
</script>

<style scoped>
.wz {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--border-soft, #e2e8f0);
  border-radius: 12px;
  background: #fff;
}

.wz__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.wz__title {
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.wz__subtitle,
.wz__help {
  font-size: 0.8rem;
  color: var(--ink-500, #64748b);
  margin: 4px 0 0;
}

.wz__notice {
  margin-bottom: 12px;
}

.wz__selects {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.wz__selects fieldset {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.wz__selects label {
  font-weight: 600;
  font-size: 0.85rem;
}

.wz__selects small {
  font-weight: 400;
  color: var(--ink-500, #64748b);
}

.wz__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.wz__toolbar-label {
  font-weight: 600;
  font-size: 0.85rem;
}

.wz__map {
  height: 420px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid var(--border-soft, #e2e8f0);
  z-index: 0;
}

.wz__map-wrap--drawing .wz__map,
.wz__map-wrap--drawing :deep(.leaflet-container),
.wz__map-wrap--drawing :deep(.leaflet-interactive) {
  cursor: crosshair;
  touch-action: none;
}

.wz__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.78rem;
  color: #334155;
  margin-top: 8px;
}

.wz__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

.wz__dot--in {
  background: #16a34a;
}

.wz__dot--out {
  background: #94a3b8;
}

.wz__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>

<style>
/* Sin scoped: Leaflet inyecta los iconos fuera del arbol del componente. */
.wz-vertex {
  background: #fff;
  border: 2px solid #f59e0b;
  border-radius: 2px;
  cursor: move;
}

.wz-midpoint {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #f59e0b;
  border-radius: 50%;
  color: #b45309;
  font-size: 11px;
  font-weight: 700;
  line-height: 12px;
  text-align: center;
  cursor: pointer;
}

.wz__map--drawing.leaflet-container,
.wz__map--drawing .leaflet-interactive {
  cursor: crosshair !important;
}
</style>
