import { apiServicesQps } from "../../api/api";
import type { Type, TypeByCommunity } from "../../interfaces/services/services.interface";
import type { NewType, Types } from "../../interfaces/types/types.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class TypesServices {

    static store = useGlobalStateStore();

    static async getTypes(page: number = 1, take: number = 10): Promise<Types> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/types?page=${page}&take=${take}`)
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

     static async getTypesByCommunity(communityId:string): Promise<TypeByCommunity[]> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/types/by-community/${communityId}`)
            return data
        } catch (error) {
            console.log(error)
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    } 

    static async createType(newType: NewType) {

        this.store.setIsLoading(true)

        try {
            await apiServicesQps.post('/types', newType)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteType(typeId: string) {

        try {
            await apiServicesQps.delete(`/types/${typeId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchType(searchWord: string, page: number = 1, take: number = 10): Promise<Type[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/types/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getTypeById(id: string): Promise<Type> {
        this.store.setIsLoading(true);

        try {
            const { data } = await apiServicesQps.get<Type>(`/types/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async updateType(typeId: string, changedValue: NewType) {
        if (!typeId) return;

        this.store.setIsLoading(true);

        try {
            await apiServicesQps.patch(`/types/${typeId}`, changedValue);
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }
}

