<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, useToast } from 'primevue';
import { showToast } from '../../../utils/show-toast';
import { resolveNewsImageUrl } from '../../../interfaces/news/news.interface';
import { NewsServices } from '../news.services';

/** Imagen opcional de la noticia: sube el archivo al instante y guarda la ruta en v-model. */
const imageUrl = defineModel<string | null>({ default: null });

const toast = useToast();
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const previewUrl = computed(() => resolveNewsImageUrl(imageUrl.value));

const pickFile = () => fileInput.value?.click();

const onFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    isUploading.value = true;
    try {
        imageUrl.value = await NewsServices.uploadImage(file);
    } catch (error) {
        showToast(toast, { severity: 'error', summary: 'Image not uploaded', detail: 'Try again with a JPG/PNG image' });
    } finally {
        isUploading.value = false;
    }
};

const removeImage = () => {
    imageUrl.value = null;
};
</script>

<template>
    <fieldset class="news-image-field">
        <label>Image <small class="text-gray-500">(optional)</small></label>
        <input ref="fileInput" type="file" accept="image/*,.heic,.heif" class="hidden" @change="onFileChange" />

        <div v-if="previewUrl" class="news-image-preview">
            <img :src="previewUrl" alt="News image preview" />
        </div>

        <div class="flex gap-2">
            <Button type="button" size="small" :loading="isUploading" :label="previewUrl ? 'Change image' : 'Upload image'"
                icon="pi pi-image" outlined @click="pickFile" />
            <Button v-if="previewUrl" type="button" size="small" severity="danger" label="Remove" icon="pi pi-trash"
                outlined @click="removeImage" />
        </div>
    </fieldset>
</template>

<style scoped lang="scss">
.news-image-field {
    display: flex;
    flex-direction: column;
    gap: .5rem;
}

.news-image-preview img {
    max-width: 100%;
    max-height: 260px;
    border-radius: 10px;
    object-fit: contain;
    border: 1px solid var(--p-surface-200);
}
</style>
