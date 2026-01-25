import { apiServicesQps } from "../../api/api";
import { TypesAdapter } from "../../interfaces/types/types.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class TypesServices {
    static store = useGlobalStateStore();
    static async getTypes(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/types?page=${page}&take=${take}`);
            return {
                data: data.data.map(TypesAdapter.fromExternalToInternal),
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
    static async getTypesByCommunity(communityId) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/types/by-community/${communityId}`);
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async createType(newType) {
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.post('/types', newType);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteType(typeId) {
        try {
            await apiServicesQps.delete(`/types/${typeId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchType(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/types/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getTypeById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/types/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateType(typeId, changedValue) {
        if (!typeId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/types/${typeId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
