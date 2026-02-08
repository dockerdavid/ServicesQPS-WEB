import { apiServicesQps } from "../../api/api";
import type {
  NewRecurringService,
  RecurringService,
  RecurringServices,
} from "../../interfaces/recurring-services/recurring-services.interface";
import genericNullObject from "../../utils/null-data-meta";

export class RecurringServicesServices {
  static async getRecurringServices(page: number = 1, take: number = 10): Promise<RecurringServices> {
    try {
      const { data } = await apiServicesQps.get<RecurringServices>(
        `/recurring-services?order=DESC&page=${page}&take=${take}`,
      );
      return data;
    } catch (error) {
      return {
        data: [],
        meta: genericNullObject.meta,
      };
    }
  }

  static async createRecurringService(payload: NewRecurringService) {
    try {
      await apiServicesQps.post('/recurring-services', payload);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  static async deleteRecurringService(id: string) {
    try {
      await apiServicesQps.delete(`/recurring-services/${id}`);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  static async searchRecurringService(searchWord: string, page: number = 1, take: number = 10): Promise<RecurringServices> {
    try {
      const { data } = await apiServicesQps.post<RecurringServices>(
        `/recurring-services/search?page=${page}&take=${take}`,
        { searchWord },
      );
      return data;
    } catch (error) {
      return {
        data: [],
        meta: genericNullObject.meta,
      };
    }
  }

  static async getRecurringServiceById(id: string): Promise<RecurringService> {
    try {
      const { data } = await apiServicesQps.get<RecurringService>(`/recurring-services/${id}`);
      return data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  static async updateRecurringService(id: string, payload: Partial<NewRecurringService>) {
    try {
      await apiServicesQps.patch(`/recurring-services/${id}`, payload);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
