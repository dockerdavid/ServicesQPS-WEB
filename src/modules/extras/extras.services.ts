import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type { Extras } from "@/interfaces/extras/extras.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class ExtrasServices {

    static store = useGlobalStateStore();

    static async getExtras(): Promise<Extras> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/extras')
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