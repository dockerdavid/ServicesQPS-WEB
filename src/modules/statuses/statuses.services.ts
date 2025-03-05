import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type { Statuses } from "@/interfaces/statuses/statuses.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class StatusesServices {

    static store = useGlobalStateStore();

    static async getStatuses(): Promise<Statuses> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/statuses')
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
}