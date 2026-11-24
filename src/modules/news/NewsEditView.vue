<script setup lang="ts">
import { ref } from 'vue';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import NewsImageField from './components/NewsImageField.vue';
import NewsAudienceField from './components/NewsAudienceField.vue';
import { NewsServices } from './news.services';
import type { NewsAudienceUser } from '../../interfaces/news/news.interface';
import type { InputConfig } from '../../interfaces/input-config.interface';

const breadcrumbRoutes = [
  { label: 'News', to: { name: 'news-default' } },
  { label: 'Edit', to: { name: 'news-edit' } },
];

const inputs = ref<InputConfig[]>([
  { label: 'Title', inputId: 'title', inputType: 'input' },
  { label: 'Body', inputId: 'body', inputType: 'textarea' },
  { label: 'Published (first publish sends push + SMS)', inputId: 'isPublished', inputType: 'switch', required: false },
]);

const initialData = {
  title: '',
  body: '',
  isPublished: false,
};

const imageUrl = ref<string | null>(null);
const audienceRoles = ref<string[]>([]);
const audienceUsers = ref<NewsAudienceUser[]>([]);

const loadData = async (id: string) => {
  const news = await NewsServices.getNewsById(id);
  imageUrl.value = news.imageUrl;
  audienceRoles.value = news.audienceRoles ?? [];
  audienceUsers.value = (news.audienceUsers ?? []).map((u) => ({ id: String(u.id), roleId: String(u.roleId) }));
  return news;
};

const updateEntity = async (id: string, data: Record<string, any>) => {
  // Audiencia e imagen viven fuera del form generico; audiencia vacia = todos (null).
  await NewsServices.updateNews(id, {
    ...data,
    audienceRoles: audienceRoles.value.length ? audienceRoles.value : null,
    audienceUserIds: audienceUsers.value.map((u) => u.id),
    isPublished: Boolean(data.isPublished),
    imageUrl: imageUrl.value,
  });
};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit news" :inputs="inputs" :load-data="loadData"
    :update-entity="updateEntity" :initial-data="initialData">
    <template #additional-fields>
      <NewsAudienceField v-model="audienceRoles" v-model:users="audienceUsers" />
      <NewsImageField v-model="imageUrl" />
    </template>
  </GenericEditForm>
</template>
