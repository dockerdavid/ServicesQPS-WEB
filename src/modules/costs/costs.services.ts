import { apiServicesQps } from "../../api/api";
import type { Communities, Community } from "../../interfaces/communities/communities.interface";
import type { Companies } from "../../interfaces/companies/companies.interface";
import { CostAdapter, type Cost, type Costs, type NewCost } from "../../interfaces/costs/costs.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class CostsServices {

    static store = useGlobalStateStore();

    static async getCosts(page: number = 1, take: number = 10): Promise<Costs> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/costs?order=DESC&page=${page}&take=${take}`)

            return {
                data: data.data.map(CostAdapter.fromExternalToInternal),
                meta: data.meta
            }
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

    static async createCost(cost: NewCost) {
        try {
            const { data } = await apiServicesQps.post('/costs', cost)
            console.log(data)
        } catch (error: any) {
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

    static async searchCost(searchWord: string, page: number = 1, take: number = 10): Promise<Cost[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/costs/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getCostById(id: string): Promise<Cost> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<Cost>(`/costs/${id}`)
            return data
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async updateCost(costId: string, changedValue: NewCost) {

        if (!costId) return

        this.store.setIsLoading(true)

        try {
            await apiServicesQps.patch(`/costs/${costId}`, changedValue)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

}