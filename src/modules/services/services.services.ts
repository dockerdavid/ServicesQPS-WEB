import { apiServicesQps } from "../../api/api";
import type CreateService from "../../interfaces/services/services.interface";
import type { Service, Services } from "../../interfaces/services/services.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class CleanersServices {

    static store = useGlobalStateStore();

    static async getServices(page: number = 1, take: number = 10): Promise<Services> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/services?page=${page}&take=${take}`)
            console.log(data)
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

    static async createService(newService: CreateService) {
        this.store.setIsLoading(true)
        try {
            await apiServicesQps.post('/services', newService)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }

    }

    static async deleteService(serviceId: string) {

        try {
            await apiServicesQps.delete(`/services/${serviceId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchService(searchWord: string, page: number = 1, take: number = 10): Promise<Service[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/services/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getServiceById(id: string): Promise<Service> {
        this.store.setIsLoading(true);

        try {
            const { data } = await apiServicesQps.get<Service>(`/services/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async updateService(serviceId: string, changedValue: CreateService) {
        if (!serviceId) return;

        this.store.setIsLoading(true);

        try {
            await apiServicesQps.patch(`/services/${serviceId}`, changedValue);
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

}