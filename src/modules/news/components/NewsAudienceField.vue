<script setup lang="ts">
import { MultiSelect } from 'primevue';
import { NEWS_AUDIENCE_OPTIONS } from '../../../interfaces/news/news.interface';

/** Roles que veran la noticia. Vacio = todos los usuarios de la app. */
const audienceRoles = defineModel<string[]>({ default: () => [] });
</script>

<template>
    <fieldset class="flex flex-col gap-2">
        <label for="news-audience">Audience <small class="text-gray-500">(empty = all app users)</small></label>
        <MultiSelect v-model="audienceRoles" inputId="news-audience" :options="NEWS_AUDIENCE_OPTIONS"
            optionLabel="label" optionValue="value" placeholder="All app users" :maxSelectedLabels="3"
            display="chip" class="w-full" />
    </fieldset>
</template>
