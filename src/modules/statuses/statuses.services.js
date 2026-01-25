import { apiServicesQps } from "../../api/api";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class StatusesServices {
    static store = useGlobalStateStore();
    static async getStatuses(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/statuses?page=${page}&take=${take}`);
            return data;
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            };
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async createStatus(statusName) {
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.post('/statuses', { statusName });
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteStatus(statusId) {
        try {
            await apiServicesQps.delete(`/statuses/${statusId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchStatus(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/statuses/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getStatusById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/statuses/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateStatus(statusId, changedValue) {
        if (!statusId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/statuses/${statusId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
