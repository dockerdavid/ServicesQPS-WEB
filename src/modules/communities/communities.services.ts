import { apiServicesQps } from "@/api/api";
import type { Communities, Community, NewCommunity } from "@/interfaces/communities/communities.interface";
import { useGlobalStateStore } from "@/store/auth.store";
import genericNullObject from "@/utils/null-data-meta";


export class CommunitiesServices {

    static store = useGlobalStateStore();

    static async getCommunities(page: number = 1, take: number = 10): Promise<Communities> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<Communities>(`/communities?page=${page}&take=${take}`)
            return data
        } catch (error: any) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async createCommunity(community: NewCommunity) {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/communities`, community)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteCommunity(communityId: string) {

        try {
            await apiServicesQps.delete(`/communities/${communityId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchCommunity(searchWord: string): Promise<Community[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/communities/search`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    /*  static async editCommunity(community: Community, changedValue: any) {
         apiServicesQps.patch(`/communities/${community.id}`, { ...community, changedValue })
     } */

}