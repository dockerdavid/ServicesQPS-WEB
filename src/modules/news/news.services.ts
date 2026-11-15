import { apiServicesQps } from "../../api/api";
import type { News, NewsList, NewsPayload } from "../../interfaces/news/news.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";

export class NewsServices {

    static store = useGlobalStateStore();

    static async getNews(page: number = 1, take: number = 10): Promise<NewsList> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.get(`/news/admin?page=${page}&take=${take}&order=DESC`)
            return data
        } catch (error) {
            return { data: [], meta: genericNullObject.meta }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async searchNews(searchWord: string, page: number = 1, take: number = 10): Promise<NewsList> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/news/search?page=${page}&take=${take}&order=DESC`, { searchWord });
            return data
        } catch (error) {
            return { data: [], meta: genericNullObject.meta }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getNewsById(id: string): Promise<News> {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get<News>(`/news/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async createNews(payload: NewsPayload) {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post<News>('/news', payload)
            return data
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async updateNews(id: string, payload: NewsPayload) {
        if (!id) return;
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.patch<News>(`/news/${id}`, payload);
            return data
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async deleteNews(id: string) {
        try {
            await apiServicesQps.delete(`/news/${id}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async uploadImage(file: File): Promise<string> {
        const payload = new FormData();
        payload.append('file', file);
        const { data } = await apiServicesQps.post<{ imageUrl: string }>('/news/upload-image', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.imageUrl;
    }
}
