import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type { NewType, Types } from "@/interfaces/types/types.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class TypesServices {

    static store = useGlobalStateStore();

    static async getTypes(): Promise<Types> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/types')
            return data
        } catch (error) {
            console.log(error)
            return {
                data:[],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async createType(newType:NewType) {

        this.store.setIsLoading(true)

        try {
            await apiServicesQps.post('/types', newType)
        } catch (error:any) {
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

}

