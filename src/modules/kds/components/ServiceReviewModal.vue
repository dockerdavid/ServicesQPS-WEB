<template>
    <Dialog
        v-model:visible="internalVisible"
        modal
        header="Información del Servicio"
        :style="{ width: '80vw', maxWidth: '98vw' }"
        :closable="true"
        @hide="onHide"
    >
        <div v-if="selectedServiceInfo" class="service-info">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Información General</h3>
                    <p><strong>ID:</strong> {{ selectedServiceInfo.id }}</p>
                    <p><strong>Fecha:</strong> {{ formatDate(selectedServiceInfo.date) }}</p>
                    <p><strong>Horario:</strong> {{ selectedServiceInfo.schedule }}</p>
                    <p><strong>Unidad:</strong> {{ selectedServiceInfo.unitNumber }}</p>
                    <p><strong>Tamaño de Unidad:</strong> {{ selectedServiceInfo.unitySize }}</p>
                </div>

                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Personal</h3>
                    <p><strong>Cleaner:</strong> {{ selectedServiceInfo.user?.name || 'N/A' }}</p>
                    <p><strong>Email:</strong> {{ selectedServiceInfo.user?.email || 'N/A' }}</p>
                    <p><strong>Teléfono:</strong> {{ selectedServiceInfo.user?.phoneNumber || 'N/A' }}</p>
                </div>

                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Comunidad</h3>
                    <p><strong>Nombre:</strong> {{ selectedServiceInfo.community?.communityName || 'N/A' }}</p>
                    <p><strong>ID Comunidad:</strong> {{ selectedServiceInfo.communityId }}</p>
                </div>

                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Servicio</h3>
                    <p><strong>Tipo:</strong> {{ selectedServiceInfo.type?.cleaningType || 'N/A' }}</p>
                    <p><strong>Descripción:</strong> {{ selectedServiceInfo.type?.description || 'N/A' }}</p>
                    <p><strong>Precio:</strong> ${{ userStore.userData?.roleId === '7' ? 'XXXX' : (selectedServiceInfo.type?.price || 'N/A') }}</p>
                    <p><strong>Comisión:</strong> {{ userStore.userData?.roleId === '7' ? 'XXXX' : (selectedServiceInfo.type?.commission || 'N/A') }}</p>
                </div>

                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Estado</h3>
                    <p><strong>Estado:</strong> {{ selectedServiceInfo.status?.statusName || 'N/A' }}</p>
                </div>

                <div class="info-group">
                    <h3 class="font-bold text-lg mb-2">Comentarios</h3>
                    <p><strong>Comentario:</strong> {{ selectedServiceInfo.comment || 'Sin comentarios' }}</p>
                    <p><strong>Comentario del Usuario:</strong> {{ selectedServiceInfo.userComment || 'Sin comentarios' }}</p>
                </div>
            </div>

            <div class="info-group mt-4">
                <h3 class="font-bold text-lg mb-2">Fechas</h3>
                <p><strong>Creado:</strong> {{ formatDate(selectedServiceInfo.createdAt) }}</p>
                <p><strong>Actualizado:</strong> {{ formatDate(selectedServiceInfo.updatedAt) }}</p>
            </div>

            <!-- Review por fotos (sin checklist): la QA manda fotos de lo que
                 quedó mal (refresh) o aprueba sin fotos. -->
            <QaPhotoReview
                :service-id="selectedServiceInfo.id"
                :capture-qa-location="userStore.userData?.roleId === '7'"
                @submitting="isSavingReview = $event"
                @submitted="onReviewSubmitted"
            />
        </div>

        <template #footer>
            <Button label="Cerrar" @click="close" :disabled="isSavingReview" class="p-button-secondary" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, Button } from 'primevue';
import { useUserStore } from '../../../store/user.store';
import { CalendarServices } from '../../calendar/calendar.services';
import { captureLocation } from '../../../composables/useGeolocation';
import type { CalendarInterface } from '../../../interfaces/calendar/calendar.interface';
import QaPhotoReview from './QaPhotoReview.vue';

const props = defineProps<{
    visible: boolean;
    service: CalendarInterface | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'review-saved'): void;
}>();

const userStore = useUserStore();

const internalVisible = ref(false);
const selectedServiceInfo = ref<CalendarInterface | null>(null);
const isSavingReview = ref(false);

watch(() => props.visible, async (val) => {
    if (val && props.service) {
        openModal(props.service);
    } else if (!val) {
        internalVisible.value = false;
    }
});

watch(internalVisible, (val) => {
    if (!val) {
        emit('update:visible', false);
    }
});

function openModal(serviceInfo: CalendarInterface) {
    if (userStore.userData?.roleId === '7' && !serviceInfo.qaStartedAt) {
        captureLocation()
            .then(loc => CalendarServices.postQAStart(serviceInfo.id, loc))
            .catch(() => {});
    }

    selectedServiceInfo.value = serviceInfo;
    internalVisible.value = true;
}

function onReviewSubmitted() {
    reset();
    emit('review-saved');
    emit('update:visible', false);
}

function close() {
    reset();
    emit('update:visible', false);
}

function onHide() {
    if (!isSavingReview.value) {
        reset();
        emit('update:visible', false);
    }
}

function reset() {
    internalVisible.value = false;
    selectedServiceInfo.value = null;
}

function formatDate(date: string | Date): string {
    const dateStr = typeof date === 'string'
        ? date.substring(0, 10)
        : `${(date as Date).getUTCFullYear()}-${String((date as Date).getUTCMonth() + 1).padStart(2, '0')}-${String((date as Date).getUTCDate()).padStart(2, '0')}`;
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
}
</script>

<style scoped>
.service-info {
    max-height: 70vh;
    overflow-y: auto;
}

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

.info-group p {
    margin: 0.5rem 0;
    line-height: 1.4;
}

.info-group strong {
    color: var(--ink-700);
}
</style>
