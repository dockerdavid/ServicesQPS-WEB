import { apiServicesQps } from "../../api/api";
import type { Status } from "../../interfaces/services/services.interface";
import type { Statuses } from "../../interfaces/statuses/statuses.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
import { removeTimestamps } from "../../utils/remove-time-stamps";


export class StatusesServices {

    static store = useGlobalStateStore();

    static async getStatuses(page: number = 1, take: number = 10): Promise<Statuses> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/statuses?page=${page}&take=${take}`)
            return data
        } catch (error) {
            console.log(error)
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async createStatus(statusName: string) {
        this.store.setIsLoading(true)

        try {
            await apiServicesQps.post('/statuses',  {statusName })
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteStatus(statusId: string) {

        try {
            await apiServicesQps.delete(`/statuses/${statusId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchStatus(searchWord: string, page: number = 1, take: number = 10): Promise<Status[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/statuses/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getStatusById(id: string): Promise<Status> {
        this.store.setIsLoading(true);

        try {
            const { data } = await apiServicesQps.get<Status>(`/statuses/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async updateStatus(statusId: string, changedValue: any) {
        if (!statusId) return;

        this.store.setIsLoading(true);

        try {
            await apiServicesQps.patch(`/statuses/${statusId}`, changedValue);
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }
}