import { useUserStore } from "../../../src/store/user.store";
import { apiServicesQps } from "../../api/api";
import { CleanerServiceAdapter, ManagerServiceAdapter, ServiceAdapter } from "../../interfaces/services/services.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
import { CommunitiesServices } from "../communities/communities.services";
export class CleanersServices {
    static store = useGlobalStateStore();
    static userStore = useUserStore();
    static async getServices(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/services?page=${page}&take=${take}&order=DESC`);
            return {
                data: data.data.map(ServiceAdapter.internalToExternal),
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
    static async getServicesByCleaner(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/services/by-cleaner/${this.userStore?.userData?.id}?page=${page}&take=${take}`);
            return {
                data: data.data.map(CleanerServiceAdapter.internalToExternal),
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
    static async getServicesByCommunities(page = 1, take = 10) {
        this.store.setIsLoading(true);
        const communities = await CommunitiesServices.getCommunitiesByManager();
        try {
            const { data } = await apiServicesQps.post(`/services/by-communities?page=${page}&take=${take}`, { communities });
            return {
                data: data.data.map(ManagerServiceAdapter.internalToExternal),
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
    static async createService(newService) {
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.post('/services', newService);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteService(serviceId) {
        try {
            await apiServicesQps.delete(`/services/${serviceId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchService(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const roleId = this.userStore?.userData?.roleId ?? '';
            const roleName = this.userStore?.userData?.role?.name?.toLowerCase() ?? '';
            const isManagerOrSupervisor = roleId === '3' || roleName === 'supervisor';
            const endpoint = isManagerOrSupervisor
                ? `/services/search/by-communities?page=${page}&take=${take}`
                : `/services/search?page=${page}&take=${take}`;
            const adapter = isManagerOrSupervisor ? ManagerServiceAdapter : ServiceAdapter;
            const { data } = await apiServicesQps.post(endpoint, { searchWord });
            return {
                data: data.data.map(adapter.internalToExternal),
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
    static async getServiceById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/services/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateService(serviceId, changedValue) {
        if (!serviceId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/services/${serviceId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
