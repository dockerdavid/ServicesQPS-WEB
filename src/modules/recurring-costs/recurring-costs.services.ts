import { apiServicesQps } from "../../api/api";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
import { RecurringCostAdapter, type NewRecurringCost, type RecurringCosts, type RecurringCost } from "../../interfaces/recurring-costs/recurring-costs.interface";

export class RecurringCostsServices {
  static store = useGlobalStateStore();

  static async getRecurringCosts(page: number = 1, take: number = 10): Promise<RecurringCosts> {
    this.store.setIsLoading(true);
    try {
      const { data } = await apiServicesQps.get(`/recurring-costs?order=DESC&page=${page}&take=${take}`);
      return {
        data: data.data.map(RecurringCostAdapter.fromExternalToInternal),
        meta: data.meta,
      };
    } catch (error) {
      return {
        data: [],
        meta: genericNullObject.meta,
      };
    } finally {
      this.store.setIsLoading(false);
    }
  }

  static async createRecurringCost(cost: NewRecurringCost) {
    try {
      await apiServicesQps.post('/recurring-costs', cost);
    } catch (error: any) {
      throw new Error(error);
    } finally {
      this.store.setIsLoading(false);
    }
  }

  static async deleteRecurringCost(costId: string) {
    try {
      await apiServicesQps.delete(`/recurring-costs/${costId}`);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  static async searchRecurringCost(searchWord: string, page: number = 1, take: number = 10): Promise<RecurringCosts> {
    this.store.setIsLoading(true);
    try {
      const { data } = await apiServicesQps.post(`/recurring-costs/search?page=${page}&take=${take}`, { searchWord });
      return {
        data: data.data.map(RecurringCostAdapter.fromExternalToInternal),
        meta: data.meta,
      };
    } catch (error) {
      return {
        data: [],
        meta: genericNullObject.meta,
      };
    } finally {
      this.store.setIsLoading(false);
    }
  }

  static async getRecurringCostById(id: string): Promise<RecurringCost> {
    this.store.setIsLoading(true);
    try {
      const { data } = await apiServicesQps.get<RecurringCost>(`/recurring-costs/${id}`);
      return data;
    } catch (error: any) {
      throw new Error(error);
    } finally {
      this.store.setIsLoading(false);
    }
  }

  static async updateRecurringCost(costId: string, changedValue: NewRecurringCost) {
    if (!costId) return;

    this.store.setIsLoading(true);
    try {
      await apiServicesQps.patch(`/recurring-costs/${costId}`, changedValue);
    } catch (error: any) {
      throw new Error(error);
    } finally {
      this.store.setIsLoading(false);
    }
  }
}
