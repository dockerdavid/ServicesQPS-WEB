import { useUserStore } from "../../../src/store/user.store";
import { apiServicesQps } from "../../api/api";
import type CreateService from "../../interfaces/services/services.interface";
import { CleanerServiceAdapter, ManagerServiceAdapter, ServiceAdapter, type EditService } from "../../interfaces/services/services.interface";
import type { Service, Services } from "../../interfaces/services/services.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
import { CommunitiesServices } from "../communities/communities.services";


export class CleanersServices {

    static store = useGlobalStateStore();
    static userStore = useUserStore();

    static async getServices(page: number = 1, take: number = 10): Promise<Services> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/services?page=${page}&take=${take}`)
            return {
                data: data.data.map(ServiceAdapter.internalToExternal),
                meta: data.meta
            }
        } catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getServicesByCleaner(page: number = 1, take: number = 10): Promise<Services> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.post(`/services/by-cleaner/${this.userStore?.userData?.id}?page=${page}&take=${take}`)
            return {
                data: data.data.map(CleanerServiceAdapter.internalToExternal),
                meta: data.meta
            }
        } catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getServicesByCommunities(page: number = 1, take: number = 10): Promise<Services> {

        this.store.setIsLoading(true)

        const communities = await CommunitiesServices.getCommunitiesByManager();

        try {
            const { data } = await apiServicesQps.post(`/services/by-communities?page=${page}&take=${take}`, { communities })
            return {
                data: data.data.map(ManagerServiceAdapter.internalToExternal),
                meta: data.meta
            }
        } catch (error) {
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

    static async searchService(searchWord: string, page: number = 1, take: number = 10): Promise<Services> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/services/search?page=${page}&take=${take}`, { searchWord });
            return {
                data: data.data.map(ServiceAdapter.internalToExternal),
                meta: data.meta
            }
        } catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
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

    static async updateService(serviceId: string, changedValue: EditService) {
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