import { apiServicesQps } from "@/api/api";
import type { Communities, Community } from "@/interfaces/communities/communities.interface";
import type { Companies } from "@/interfaces/companies/companies.interface";
import type { Costs } from "@/interfaces/costs/costs.interface";
import type { Extra, Extras, NewExtra } from "@/interfaces/extras/extras.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class ExtrasServices {

    static store = useGlobalStateStore();

    static async getExtras(page: number = 1, take: number = 10): Promise<Extras> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/extras?page=${page}&take=${take}`)
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

    static async createExtra(newExtra: NewExtra) {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.post('/extras', newExtra)
            console.log(data)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteExtra(extraId: string) {

        try {
            await apiServicesQps.delete(`/extras/${extraId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchExtra(searchWord: string): Promise<Extra[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/extras/search`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getExtraById(id: string): Promise<Extra> {
        this.store.setIsLoading(true);

        try {
            const { data } = await apiServicesQps.get<Extra>(`/extras/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async updateExtra(extraId: string, changedValue: NewExtra) {
        if (!extraId) return;

        this.store.setIsLoading(true);

        try {
            await apiServicesQps.patch(`/extras/${extraId}`, changedValue);
        } catch (error: any) {
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

}