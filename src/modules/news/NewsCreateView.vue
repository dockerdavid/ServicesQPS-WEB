<script lang="ts" setup>
import { ref } from 'vue';
import type { InputConfig } from '../../interfaces/input-config.interface';
import GenericCreateForm from '../shared/views/GenericCreateForm.vue';
import NewsImageField from './components/NewsImageField.vue';
import NewsAudienceField from './components/NewsAudienceField.vue';
import { NewsServices } from './news.services';

const breadcrumbRoutes = [
  { label: 'News', to: { name: 'news-default' } },
  { label: 'Create', to: { name: 'news-create' } },
];

const inputs: InputConfig[] = [
  { label: 'Title', inputId: 'title', inputType: 'input' },
  { label: 'Body', inputId: 'body', inputType: 'textarea' },
  { label: 'Published (sends push notification)', inputId: 'isPublished', inputType: 'switch', required: false, defaultValue: false },
];

const imageUrl = ref<string | null>(null);
const audienceRoles = ref<string[]>([]);

const createEntity = async (data: Record<string, any>) => {
  await NewsServices.createNews({
    title: data.title,
    body: data.body,
    audienceRoles: audienceRoles.value.length ? audienceRoles.value : null,
    isPublished: Boolean(data.isPublished),
    imageUrl: imageUrl.value,
  });
  imageUrl.value = null;
  audienceRoles.value = [];
};
</script>

<template>
  <GenericCreateForm :breadcrumb-routes="breadcrumbRoutes" view-title="Create news" :inputs="inputs"
    :create-entity="createEntity">
    <template #additional-fields>
      <NewsAudienceField v-model="audienceRoles" />
      <NewsImageField v-model="imageUrl" />
    </template>
  </GenericCreateForm>
</template>
