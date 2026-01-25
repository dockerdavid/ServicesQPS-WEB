import { apiServicesQps } from "../../api/api";
import { ExtraAdapter } from "../../interfaces/extras/extras.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class ExtrasServices {
    static store = useGlobalStateStore();
    static async getExtras(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/extras?page=${page}&take=${take}`);
            return {
                data: data.data.map(ExtraAdapter.fromExternalToInternal),
                meta: data.meta
            };
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
    static async createExtra(newExtra) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post('/extras', newExtra);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteExtra(extraId) {
        try {
            await apiServicesQps.delete(`/extras/${extraId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchExtra(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/extras/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getExtraById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/extras/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateExtra(extraId, changedValue) {
        if (!extraId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/extras/${extraId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
