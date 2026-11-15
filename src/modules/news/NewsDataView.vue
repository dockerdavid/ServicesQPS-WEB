<script setup lang="ts">
import GenericDataView from "../shared/views/GenericDataView.vue";
import { NewsServices } from "./news.services";
import { formatNewsAudience } from "../../interfaces/news/news.interface";

const fetchNews = async (page: number, rows: number) => {
    return await NewsServices.getNews(page, rows);
};

const deleteNews = async (id: string) => {
    return await NewsServices.deleteNews(id);
};

const searchNews = async (searchWord: any, page: number, rows: number) => {
    return await NewsServices.searchNews(searchWord, page, rows)
};

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : '-';
</script>

<template>
    <GenericDataView view-title="News" create-new-route="news-create" route-base="news" :headers="[
        { field: 'title', name: 'Title' },
        { field: 'isPublished', name: 'Published', format: (value) => value ? 'Sí' : 'No' },
        { field: 'publishedAt', name: 'Published at', format: (value) => formatDate(value) },
        { field: 'audienceRoles', name: 'Audience', format: (value) => formatNewsAudience(value) },
        { field: 'imageUrl', name: 'Image', format: (value) => value ? 'Sí' : 'No' },
    ]" :fetch-data="fetchNews" :delete-data="deleteNews" :search-data="searchNews" />
</template>
