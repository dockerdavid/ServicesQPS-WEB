<template>
  <fieldset class="map-picker">
    <label>
      Ubicación del complex
      <small class="map-picker__hint">se le envía por SMS al cleaner cuando acepta el servicio</small>
    </label>

    <!-- Buscar por nombre/dirección -->
    <div class="map-picker__search">
      <InputText
        v-model="consulta"
        placeholder="Buscar el complex por nombre o dirección…"
        class="w-full"
        @keydown.enter.prevent="buscar"
      />
      <Button
        label="Buscar"
        icon="pi pi-search"
        severity="secondary"
        :loading="buscando"
        @click="buscar"
      />
    </div>

    <ul v-if="resultados.length" class="map-picker__results">
      <li v-for="r in resultados" :key="r.place_id">
        <button type="button" @click="usarResultado(r)">
          <i class="pi pi-map-marker" />
          <span>{{ r.display_name }}</span>
        </button>
      </li>
    </ul>
    <p v-else-if="buscoSinResultados" class="map-picker__empty">
      Sin resultados. Puedes pegar el link de Google Maps abajo o hacer clic directo en el mapa.
    </p>

    <!-- Mapa -->
    <div ref="contenedorMapa" class="map-picker__map"></div>
    <p class="map-picker__help">
      Haz clic en el mapa para poner el pin, o arrástralo para ajustarlo.
    </p>

    <!-- Pegar link de Google Maps o coordenadas -->
    <div class="map-picker__paste">
      <InputText
        v-model="pegado"
        placeholder="…o pega aquí un link de Google Maps o «28.5383, -81.3792»"
        class="w-full"
        @keydown.enter.prevent="usarPegado"
      />
      <Button label="Usar" severity="secondary" outlined @click="usarPegado" />
    </div>

    <!-- Estado actual -->
    <div v-if="tieneUbicacion" class="map-picker__current">
      <div class="map-picker__coords">
        <i class="pi pi-check-circle" />
        <span>{{ latitude!.toFixed(6) }}, {{ longitude!.toFixed(6) }}</span>
      </div>
      <div class="map-picker__actions">
        <a :href="linkMapa!" target="_blank" rel="noopener noreferrer" class="map-picker__link">
          <i class="pi pi-external-link" /> Abrir en Google Maps
        </a>
        <Button label="Quitar ubicación" severity="danger" text size="small" @click="limpiar" />
      </div>
      <div class="map-picker__sms">
        <span class="map-picker__sms-title">Así le llegará al cleaner:</span>
        <code>…in apartment number 2-401<br />Map: {{ linkMapa }}</code>
      </div>
    </div>
    <p v-else class="map-picker__none">
      Sin ubicación. El SMS saldrá igual que hoy, solo que sin el mapa.
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, InputText, useToast } from 'primevue';
import { showToast } from '../../../utils/show-toast';
import { extraerCoordenadas } from '../../../utils/parse-coordinates';

interface ResultadoBusqueda {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const latitude = defineModel<number | null>('latitude', { default: null });
const longitude = defineModel<number | null>('longitude', { default: null });

const toast = useToast();
const contenedorMapa = ref<HTMLElement | null>(null);
const consulta = ref('');
const pegado = ref('');
const resultados = ref<ResultadoBusqueda[]>([]);
const buscando = ref(false);
const buscoSinResultados = ref(false);

// Orlando, FL: la mayoría de los complex están por ahí, así que es mejor
// punto de partida que un mapa del mundo entero cuando aún no hay pin.
const CENTRO_POR_DEFECTO: L.LatLngExpression = [28.5383, -81.3792];
const ZOOM_SIN_PIN = 11;
const ZOOM_CON_PIN = 17;

let mapa: L.Map | null = null;
let marcador: L.Marker | null = null;

const tieneUbicacion = computed(
  () => typeof latitude.value === 'number' && typeof longitude.value === 'number',
);

const linkMapa = computed(() =>
  tieneUbicacion.value
    ? `https://maps.google.com/?q=${latitude.value!.toFixed(6)},${longitude.value!.toFixed(6)}`
    : null,
);

const icono = L.divIcon({
  className: 'map-picker__pin',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function fijar(lat: number, lng: number, acercar = true) {
  latitude.value = Number(lat.toFixed(6));
  longitude.value = Number(lng.toFixed(6));
  dibujarMarcador();
  if (mapa && acercar) {
    mapa.setView([lat, lng], Math.max(mapa.getZoom(), ZOOM_CON_PIN));
  }
}

function dibujarMarcador() {
  if (!mapa) return;

  if (!tieneUbicacion.value) {
    if (marcador) {
      marcador.remove();
      marcador = null;
    }
    return;
  }

  const posicion: L.LatLngExpression = [latitude.value!, longitude.value!];

  if (marcador) {
    marcador.setLatLng(posicion);
    return;
  }

  marcador = L.marker(posicion, { icon: icono, draggable: true }).addTo(mapa);
  marcador.on('dragend', () => {
    const p = marcador!.getLatLng();
    fijar(p.lat, p.lng, false);
  });
}

function limpiar() {
  latitude.value = null;
  longitude.value = null;
  dibujarMarcador();
}

async function buscar() {
  const q = consulta.value.trim();
  if (!q) return;

  buscando.value = true;
  buscoSinResultados.value = false;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const respuesta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    resultados.value = await respuesta.json();
    buscoSinResultados.value = resultados.value.length === 0;
  } catch {
    resultados.value = [];
    showToast(toast, {
      severity: 'error',
      summary: 'No se pudo buscar la dirección',
      detail: 'Pega el link de Google Maps o marca el punto en el mapa.',
    });
  } finally {
    buscando.value = false;
  }
}

function usarResultado(r: ResultadoBusqueda) {
  fijar(Number(r.lat), Number(r.lon));
  resultados.value = [];
  consulta.value = r.display_name;
}

function usarPegado() {
  const coords = extraerCoordenadas(pegado.value);
  if (!coords) {
    showToast(toast, {
      severity: 'warn',
      summary: 'No reconocí esas coordenadas',
      detail: 'Pega el link de Google Maps del sitio, o «28.5383, -81.3792».',
    });
    return;
  }
  fijar(coords.lat, coords.lng);
  pegado.value = '';
}

onMounted(async () => {
  await nextTick();
  if (!contenedorMapa.value) return;

  const centro: L.LatLngExpression = tieneUbicacion.value
    ? [latitude.value!, longitude.value!]
    : CENTRO_POR_DEFECTO;

  mapa = L.map(contenedorMapa.value).setView(
    centro,
    tieneUbicacion.value ? ZOOM_CON_PIN : ZOOM_SIN_PIN,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapa);

  mapa.on('click', (e: L.LeafletMouseEvent) => fijar(e.latlng.lat, e.latlng.lng, false));

  dibujarMarcador();

  // El contenedor suele montarse oculto/animándose: sin esto Leaflet calcula
  // mal el tamaño y el mapa aparece cortado.
  setTimeout(() => mapa?.invalidateSize(), 250);
});

// Los datos de la comunidad llegan por fetch DESPUÉS del montaje: cuando caen,
// hay que dibujar el pin y centrar el mapa.
watch([latitude, longitude], ([lat, lng], [latPrevia, lngPrevia]) => {
  if (!mapa) return;
  dibujarMarcador();
  const acabaDeLlegar = latPrevia === null && lngPrevia === null && lat !== null && lng !== null;
  if (acabaDeLlegar) {
    mapa.setView([lat!, lng!], ZOOM_CON_PIN);
  }
});

onBeforeUnmount(() => {
  mapa?.remove();
  mapa = null;
  marcador = null;
});
</script>

<style scoped>
.map-picker {
  grid-column: 1 / -1;
}

.map-picker__hint {
  color: var(--ink-500, #64748b);
  font-weight: 400;
}

.map-picker__search,
.map-picker__paste {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.map-picker__paste {
  margin-top: 8px;
  margin-bottom: 0;
}

.map-picker__results {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  border: 1px solid var(--border-soft, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  max-height: 190px;
  overflow-y: auto;
}

.map-picker__results button {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: #fff;
  text-align: left;
  font-size: 0.8rem;
  cursor: pointer;
}

.map-picker__results button:hover {
  background: #f1f5f9;
}

.map-picker__empty,
.map-picker__help,
.map-picker__none {
  font-size: 0.75rem;
  color: var(--ink-500, #64748b);
  margin: 6px 0 0;
}

.map-picker__map {
  height: 300px;
  border-radius: 10px;
  border: 1px solid var(--border-soft, #e2e8f0);
  z-index: 0;
}

.map-picker__current {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: 10px;
}

.map-picker__coords {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #166534;
}

.map-picker__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
}

.map-picker__link {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d4ed8;
}

.map-picker__sms {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #bbf7d0;
}

.map-picker__sms-title {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #15803d;
  margin-bottom: 4px;
}

.map-picker__sms code {
  font-size: 0.75rem;
  color: #334155;
  word-break: break-all;
}
</style>

<style>
/* El pin va sin `scoped`: Leaflet lo inyecta fuera del árbol del componente. */
.map-picker__pin span {
  display: block;
  width: 20px;
  height: 20px;
  margin: 3px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: #dc2626;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
</style>
