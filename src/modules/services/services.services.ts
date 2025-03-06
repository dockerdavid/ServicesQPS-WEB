import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type CreateService from "@/interfaces/services/services.interface";
import type { Services } from "@/interfaces/services/services.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class CleanersServices {

    static store = useGlobalStateStore();

    static async getServices(): Promise<Services> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/services')
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

}