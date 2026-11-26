<template>
    <div class="refresh-gallery">
        <p v-if="isLoading" class="text-sm text-gray-500">Cargando fotos de refresh...</p>
        <p v-else-if="loadError" class="text-sm text-red-600">No se pudieron cargar las fotos de refresh.</p>
        <p v-else-if="rounds.length === 0" class="text-sm text-gray-500">{{ emptyText }}</p>

        <div v-for="round in rounds" :key="round.round" class="refresh-round">
            <div class="refresh-round__header">
                <span class="refresh-round__title">Refresh #{{ round.round }}</span>
                <span class="refresh-round__meta">
                    {{ formatDateTime(round.createdAt) }}
                    <template v-if="round.qaUser"> · {{ round.qaUser.name }}</template>
                    · {{ round.photos.length }} {{ round.photos.length === 1 ? 'foto' : 'fotos' }}
                </span>
            </div>
            <p v-if="round.message" class="refresh-round__message">{{ round.message }}</p>
            <div class="refresh-round__thumbs">
                <button
                    v-for="(photo, index) in round.photos"
                    :key="photo.id"
                    type="button"
                    class="refresh-thumb"
                    @click="openLightbox(round, index)"
                >
                    <img :src="resolveApiFileUrl(photo.url)" :alt="`Refresh ${round.round} foto ${index + 1}`" loading="lazy" />
                </button>
            </div>
        </div>

        <Dialog
            v-model:visible="lightboxVisible"
            modal
            :header="lightboxTitle"
            :style="{ width: '90vw', maxWidth: '1100px' }"
            :dismissable-mask="true"
        >
            <div v-if="lightboxRound" class="lightbox" @keydown.left="prev" @keydown.right="next" tabindex="0">
                <Button
                    v-if="lightboxRound.photos.length > 1"
                    icon="pi pi-chevron-left"
                    rounded
                    text
                    class="lightbox__nav"
                    aria-label="Anterior"
                    @click="prev"
                />
                <img
                    :src="resolveApiFileUrl(lightboxRound.photos[lightboxIndex]?.url)"
                    class="lightbox__img"
                    alt="Foto de refresh"
                />
                <Button
                    v-if="lightboxRound.photos.length > 1"
                    icon="pi pi-chevron-right"
                    rounded
                    text
                    class="lightbox__nav"
                    aria-label="Siguiente"
                    @click="next"
                />
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, Button } from 'primevue';
import { CalendarServices } from '../../calendar/calendar.services';
import { resolveApiFileUrl, type RefreshPhotosRound } from '../../../interfaces/calendar/calendar.interface';

const props = withDefaults(defineProps<{
    serviceId: string | null | undefined;
    emptyText?: string;
}>(), {
    emptyText: 'Este servicio no tiene refresh con fotos.',
});

const rounds = ref<RefreshPhotosRound[]>([]);
const isLoading = ref(false);
const loadError = ref(false);

const lightboxVisible = ref(false);
const lightboxRound = ref<RefreshPhotosRound | null>(null);
const lightboxIndex = ref(0);

const lightboxTitle = computed(() => {
    if (!lightboxRound.value) return '';
    return `Refresh #${lightboxRound.value.round} · ${lightboxIndex.value + 1}/${lightboxRound.value.photos.length}`;
});

async function load() {
    rounds.value = [];
    loadError.value = false;
    if (!props.serviceId) return;
    isLoading.value = true;
    try {
        rounds.value = await CalendarServices.getRefreshPhotos(props.serviceId);
    } catch {
        loadError.value = true;
    } finally {
        isLoading.value = false;
    }
}

watch(() => props.serviceId, load, { immediate: true });

function openLightbox(round: RefreshPhotosRound, index: number) {
    lightboxRound.value = round;
    lightboxIndex.value = index;
    lightboxVisible.value = true;
}

function prev() {
    const total = lightboxRound.value?.photos.length ?? 0;
    if (total) lightboxIndex.value = (lightboxIndex.value - 1 + total) % total;
}

function next() {
    const total = lightboxRound.value?.photos.length ?? 0;
    if (total) lightboxIndex.value = (lightboxIndex.value + 1) % total;
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

defineExpose({ reload: load });
</script>

<style scoped>
.refresh-round {
    border-left: 3px solid #f97316;
    padding-left: 0.75rem;
    margin-bottom: 1rem;
}

.refresh-round__header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
}

.refresh-round__title {
    font-weight: 700;
    color: #c2410c;
}

.refresh-round__meta {
    font-size: 0.8rem;
    color: #64748b;
}

.refresh-round__message {
    font-size: 0.875rem;
    margin: 0.25rem 0;
    white-space: pre-wrap;
}

.refresh-round__thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.refresh-thumb {
    width: 88px;
    height: 88px;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    cursor: zoom-in;
    background: #f1f5f9;
}

.refresh-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.lightbox {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    outline: none;
}

.lightbox__img {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    border-radius: 6px;
    min-width: 0;
}

.lightbox__nav {
    flex-shrink: 0;
}
</style>
