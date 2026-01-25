import { apiServicesQps } from "../../api/api";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
import { RecurringCostAdapter } from "../../interfaces/recurring-costs/recurring-costs.interface";
export class RecurringCostsServices {
    static store = useGlobalStateStore();
    static async getRecurringCosts(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/recurring-costs?order=DESC&page=${page}&take=${take}`);
            return {
                data: data.data.map(RecurringCostAdapter.fromExternalToInternal),
                meta: data.meta,
            };
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta,
            };
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async createRecurringCost(cost) {
        try {
            await apiServicesQps.post('/recurring-costs', cost);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteRecurringCost(costId) {
        try {
            await apiServicesQps.delete(`/recurring-costs/${costId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchRecurringCost(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/recurring-costs/search?page=${page}&take=${take}`, { searchWord });
            return {
                data: data.data.map(RecurringCostAdapter.fromExternalToInternal),
                meta: data.meta,
            };
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta,
            };
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getRecurringCostById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/recurring-costs/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateRecurringCost(costId, changedValue) {
        if (!costId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/recurring-costs/${costId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
