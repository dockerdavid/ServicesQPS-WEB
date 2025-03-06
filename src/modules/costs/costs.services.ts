import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs, NewCost } from "@/interfaces/costs/costs.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class CostsServices {

    static store = useGlobalStateStore();

    static async getCosts(): Promise<Costs> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/costs')
            console.log(data)
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

    static async createCost(cost:NewCost) {
        try {
            const { data } = await apiServicesQps.post('/costs', cost)
            console.log(data)
        } catch (error:any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteCost(costId: string) {

        try {
            await apiServicesQps.delete(`/costs/${costId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

}