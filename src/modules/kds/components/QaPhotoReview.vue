<template>
    <div class="qa-photo-review">
        <!-- Historial: fotos que ya se mandaron a refresh, por ronda -->
        <div class="info-group mt-4">
            <h3 class="font-bold text-lg mb-2">Refresh: fotos de lo que quedó mal</h3>
            <RefreshPhotosGallery ref="galleryRef" :service-id="serviceId" />
        </div>

        <!-- Revisión nueva: solo fotos (sin checklist) -->
        <div v-if="canReview" class="info-group mt-4">
            <h3 class="font-bold text-lg mb-2">Review</h3>
            <p class="text-sm text-gray-600 mb-3">
                Toma o sube fotos de los lugares que quedaron mal. Si mandas fotos, el servicio vuelve a refresh.
                Si todo está bien, apruébalo sin fotos.
            </p>

            <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onFilesSelected"
            />

            <div class="photo-grid">
                <div v-for="(photo, index) in photos" :key="photo.key" class="photo-tile">
                    <img :src="photo.previewUrl" :alt="`Foto ${index + 1}`" />
                    <button
                        type="button"
                        class="photo-tile__remove"
                        :disabled="isSubmitting"
                        aria-label="Quitar foto"
                        @click="removePhoto(index)"
                    >
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <button
                    type="button"
                    class="photo-add"
                    :disabled="isSubmitting || photos.length >= MAX_PHOTOS"
                    @click="fileInputRef?.click()"
                >
                    <i class="pi pi-camera" style="font-size: 1.25rem;"></i>
                    <span>Agregar fotos</span>
                </button>
            </div>
            <p v-if="photos.length >= MAX_PHOTOS" class="text-xs text-gray-500 mt-1">Máximo {{ MAX_PHOTOS }} fotos por refresh.</p>

            <div class="mt-3">
                <h4 class="font-semibold text-md mb-2">Comentario (opcional):</h4>
                <Textarea
                    v-model="comment"
                    placeholder="Escribe un comentario para la cleaner..."
                    :rows="3"
                    :auto-resize="false"
                    class="w-full"
                    style="max-height: 150px;"
                    :disabled="isSubmitting"
                />
            </div>

            <div class="flex flex-wrap justify-end gap-2 mt-3">
                <Button
                    v-if="photos.length === 0"
                    label="Aprobar sin fotos"
                    icon="pi pi-check"
                    severity="success"
                    :loading="isSubmitting"
                    @click="approve"
                />
                <Button
                    v-else
                    :label="`Mandar refresh (${photos.length})`"
                    icon="pi pi-refresh"
                    severity="warn"
                    :disabled="isSubmitting"
                    @click="confirmVisible = true"
                />
            </div>
        </div>

        <!-- Recap antes de mandar el refresh -->
        <Dialog
            v-model:visible="confirmVisible"
            modal
            header="Confirmar refresh"
            :style="{ width: '640px', maxWidth: '95vw' }"
            :closable="!isSubmitting"
        >
            <p class="font-semibold mb-3">
                Vas a mandar refresh con {{ photos.length }} {{ photos.length === 1 ? 'foto' : 'fotos' }}.
            </p>
            <div class="photo-grid photo-grid--recap">
                <div v-for="(photo, index) in photos" :key="photo.key" class="photo-tile">
                    <img :src="photo.previewUrl" :alt="`Foto ${index + 1}`" />
                </div>
            </div>
            <p v-if="comment.trim()" class="text-sm mt-3"><strong>Comentario:</strong> {{ comment.trim() }}</p>
            <p v-if="progressText" class="text-sm text-gray-600 mt-3">{{ progressText }}</p>

            <template #footer>
                <Button label="Volver" severity="secondary" text :disabled="isSubmitting" @click="confirmVisible = false" />
                <Button
                    label="Mandar refresh"
                    icon="pi pi-send"
                    severity="warn"
                    :loading="isSubmitting"
                    @click="sendRefresh"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { Dialog, Button, Textarea, useToast } from 'primevue';
import RefreshPhotosGallery from './RefreshPhotosGallery.vue';
import { CalendarServices } from '../../calendar/calendar.services';
import { captureLocation } from '../../../composables/useGeolocation';
import { showToast } from '../../../utils/show-toast';

type LocalPhoto = { key: string; file: File; previewUrl: string; photoPath?: string };

const MAX_PHOTOS = 30;
const MAX_SIZE = 10 * 1024 * 1024;

const props = withDefaults(defineProps<{
    serviceId: string | null | undefined;
    /** Solo QA captura ubicación al terminar la revisión. */
    captureQaLocation?: boolean;
    canReview?: boolean;
}>(), {
    captureQaLocation: false,
    canReview: true,
});

const emit = defineEmits<{
    (e: 'submitted', result: 'refresh' | 'approved'): void;
    (e: 'submitting', value: boolean): void;
}>();

const toast = useToast();
const fileInputRef = ref<HTMLInputElement | null>(null);
const galleryRef = ref<InstanceType<typeof RefreshPhotosGallery> | null>(null);
const photos = ref<LocalPhoto[]>([]);
const comment = ref('');
const confirmVisible = ref(false);
const isSubmitting = ref(false);
const progressText = ref('');

watch(isSubmitting, (value) => emit('submitting', value));
watch(() => props.serviceId, () => reset());

function onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    let skipped = 0;
    for (const file of files) {
        if (photos.value.length >= MAX_PHOTOS) break;
        const isImage = file.type.startsWith('image/') || /\.(hei[cf]|jpe?g|png|webp)$/i.test(file.name);
        if (!isImage || file.size > MAX_SIZE) {
            skipped += 1;
            continue;
        }
        photos.value.push({
            key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            previewUrl: URL.createObjectURL(file),
        });
    }

    if (skipped) {
        showToast(toast, { severity: 'warn', summary: `${skipped} archivo(s) ignorado(s): solo imágenes de hasta 10MB.` });
    }
}

function removePhoto(index: number) {
    const [removed] = photos.value.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
}

async function getFinishLocation(): Promise<Record<string, any>> {
    if (!props.captureQaLocation) return {};
    try {
        return await captureLocation();
    } catch {
        return {};
    }
}

async function submit(refreshPhotos: string[]) {
    if (!props.serviceId) return;
    const finishLocation = await getFinishLocation();
    await CalendarServices.postServiceReview({
        serviceId: props.serviceId,
        message: comment.value.trim() || undefined,
        refreshPhotos,
        ...finishLocation,
    });
}

async function approve() {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
        await submit([]);
        showToast(toast, { severity: 'success', summary: 'Servicio aprobado.' });
        reset();
        emit('submitted', 'approved');
    } catch {
        showToast(toast, { severity: 'error', summary: 'No se pudo aprobar el servicio.' });
    } finally {
        isSubmitting.value = false;
    }
}

async function sendRefresh() {
    if (isSubmitting.value || photos.value.length === 0) return;
    isSubmitting.value = true;
    try {
        // Se suben al confirmar (no al elegir) para no dejar fotos huérfanas
        // de las que la QA quitó. Si un reintento falla a la mitad, las ya
        // subidas no se vuelven a subir.
        const total = photos.value.length;
        for (let i = 0; i < total; i++) {
            const photo = photos.value[i];
            if (photo.photoPath) continue;
            progressText.value = `Subiendo foto ${i + 1} de ${total}...`;
            const uploaded = await CalendarServices.uploadRefreshPhoto(photo.file);
            photo.photoPath = uploaded.photoPath;
        }
        progressText.value = 'Mandando refresh...';
        await submit(photos.value.map(photo => photo.photoPath!).filter(Boolean));
        showToast(toast, { severity: 'success', summary: `Refresh enviado con ${total} ${total === 1 ? 'foto' : 'fotos'}.` });
        confirmVisible.value = false;
        reset();
        emit('submitted', 'refresh');
    } catch {
        showToast(toast, { severity: 'error', summary: 'No se pudo mandar el refresh. Intenta de nuevo.' });
    } finally {
        progressText.value = '';
        isSubmitting.value = false;
    }
}

function reset() {
    photos.value.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    photos.value = [];
    comment.value = '';
    confirmVisible.value = false;
}

onBeforeUnmount(reset);

defineExpose({ reset, isSubmitting, reloadHistory: () => galleryRef.value?.reload() });
</script>

<style scoped>
.info-group {
    background-color: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-soft);
}

.info-group h3 {
    color: var(--ink-800);
    border-bottom: 2px solid var(--accent-500);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}

.photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.photo-tile {
    position: relative;
    width: 96px;
    height: 96px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #f1f5f9;
}

.photo-grid--recap .photo-tile {
    width: 110px;
    height: 110px;
}

.photo-tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.photo-tile__remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(15, 23, 42, 0.75);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.7rem;
}

.photo-add {
    width: 96px;
    height: 96px;
    border-radius: 6px;
    border: 2px dashed #94a3b8;
    background: white;
    color: #475569;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    cursor: pointer;
}

.photo-add:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
