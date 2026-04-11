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

            <!-- Sección Review -->
            <div class="info-group mt-4">
                <h3 class="font-bold text-lg mb-4">Review</h3>
                <div v-for="reviewClass in reviewData" :key="reviewClass.reviewClassId" class="review-section mb-4">
                    <h4 class="font-semibold text-md mb-2 text-blue-600">{{ reviewClass.reviewClassName }}:</h4>
                    <div class="hidden md:grid grid-cols-1 gap-2">
                        <div v-for="item in reviewClass.reviewItems" :key="item.id"
                            class="flex items-center justify-between p-2 bg-gray-50 rounded whitespace-nowrap">
                            <span class="text-sm mr-4">{{ item.name }}</span>
                            <InputSwitch v-model="item.checked" />
                        </div>
                    </div>
                    <div class="md:hidden overflow-x-auto">
                        <div class="flex gap-2 min-w-max">
                            <div v-for="item in reviewClass.reviewItems" :key="item.id"
                                class="flex items-center justify-between p-2 bg-gray-50 rounded whitespace-nowrap">
                                <span class="text-sm mr-4">{{ item.name }}</span>
                                <InputSwitch v-model="item.checked" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="review-section mb-4">
                    <h4 class="font-semibold text-md mb-2 text-blue-600">Comentario:</h4>
                    <fieldset>
                        <Textarea
                            v-model="reviewComment"
                            placeholder="Escribe un comentario sobre el review..."
                            :rows="4"
                            :auto-resize="false"
                            class="w-full"
                            style="max-height: 150px;"
                        />
                    </fieldset>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Guardar" @click="saveAndClose" :disabled="isSavingReview" class="p-button-secondary" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, Button, InputSwitch, Textarea } from 'primevue';
import { useUserStore } from '../../../store/user.store';
import { CalendarServices } from '../../calendar/calendar.services';
import { captureLocation } from '../../../composables/useGeolocation';
import type { CalendarInterface } from '../../../interfaces/calendar/calendar.interface';

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
const reviewData = ref<any[]>([]);
const reviewComment = ref('');
const isSavingReview = ref(false);

watch(() => props.visible, async (val) => {
    if (val && props.service) {
        await openModal(props.service);
    } else if (!val) {
        internalVisible.value = false;
    }
});

watch(internalVisible, (val) => {
    if (!val) {
        emit('update:visible', false);
    }
});

async function openModal(serviceInfo: CalendarInterface) {
    if (userStore.userData?.roleId === '7' && !serviceInfo.qaStartedAt) {
        captureLocation()
            .then(loc => CalendarServices.postQAStart(serviceInfo.id, loc))
            .catch(() => {});
    }

    selectedServiceInfo.value = serviceInfo;
    const data = await CalendarServices.getReviewItemsWithClasses();
    const serviceReviews = serviceInfo.reviews || [];

    if (Array.isArray(data)) {
        reviewData.value = data.map((cls: any) => ({
            ...cls,
            reviewItems: cls.reviewItems.map((item: any) => {
                const found = serviceReviews.find((r: any) => r.reviewItemId === item.id);
                return { ...item, checked: found ? found.value === 1 : false };
            }),
        }));
    } else {
        reviewData.value = [];
    }

    internalVisible.value = true;
}

async function saveAndClose() {
    isSavingReview.value = true;
    const serviceId = selectedServiceInfo.value?.id || '';
    const message = reviewComment.value;
    const reviewItemsPayload: { reviewItemId: string; value: boolean }[] = [];

    reviewData.value.forEach((cls: any) => {
        cls.reviewItems.forEach((item: any) => {
            reviewItemsPayload.push({ reviewItemId: item.id, value: !!item.checked });
        });
    });

    if (serviceId) {
        let finishLocation: any = {};
        if (userStore.userData?.roleId === '7') {
            try {
                finishLocation = await captureLocation();
            } catch {
                // location failed — submit without finish coords
            }
        }
        await CalendarServices.postServiceReview({
            serviceId,
            message,
            reviewItems: reviewItemsPayload,
            ...finishLocation,
        });
    }

    reset();
    isSavingReview.value = false;
    emit('review-saved');
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
    reviewComment.value = '';
    reviewData.value = [];
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

.review-section {
    border-left: 3px solid var(--accent-500);
    padding-left: 1rem;
}

.review-section h4 {
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: var(--accent-600);
}
</style>
