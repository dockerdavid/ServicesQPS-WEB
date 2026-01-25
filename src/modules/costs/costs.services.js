import { apiServicesQps } from "../../api/api";
import { CostAdapter } from "../../interfaces/costs/costs.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class CostsServices {
    static store = useGlobalStateStore();
    static async getCosts(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/costs?order=DESC&page=${page}&take=${take}`);
            return {
                data: data.data.map(CostAdapter.fromExternalToInternal),
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
    static async createCost(cost) {
        try {
            const { data } = await apiServicesQps.post('/costs', cost);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteCost(costId) {
        try {
            await apiServicesQps.delete(`/costs/${costId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchCost(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/costs/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getCostById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/costs/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateCost(costId, changedValue) {
        if (!costId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/costs/${costId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
