import { apiServicesQps } from "@/api/api";
import type { Communities, Community, NewCommunity } from "@/interfaces/communities/communities.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class CommunitiesServices {

    static store = useGlobalStateStore();

    static async getCommunities(): Promise<Communities> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/communities')
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

    static async editCommunity(community: Community, changedValue: any) {
        apiServicesQps.patch(`/communities/${community.id}`, { ...community, changedValue })
    }

    static async createCommunity(community: NewCommunity) {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/communities`, community)
            console.log(data)
        } catch (error) {
            console.log(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteCommunity(community: Community) {
        try {
            await apiServicesQps.delete(`/communities/${community.id}`)
            console.log('éxito')
        } catch (error) {
            console.log(error)
        }
    }



}