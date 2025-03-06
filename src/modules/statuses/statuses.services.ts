import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type { Statuses } from "@/interfaces/statuses/statuses.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class StatusesServices {

    static store = useGlobalStateStore();

    static async getStatuses(page: number = 1, take:number = 10): Promise<Statuses> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/statuses?page=${page}&take=${take}`)
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

    static async createStatus(statusName: string) {
        this.store.setIsLoading(true)

        try {
            await apiServicesQps.post('/statuses', { statusName })
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteStatus(statusId: string) {
        
        try {
            await apiServicesQps.delete(`/statuses/${statusId}`)
        } catch (error: any) {
            throw new Error(error)
        } 
    }

}