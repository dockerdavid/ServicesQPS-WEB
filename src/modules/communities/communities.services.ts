import { useUserStore } from "../../../src/store/user.store";
import { apiServicesQps } from "../../api/api";
import type { Communities, Community, NewCommunity } from "../../interfaces/communities/communities.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class CommunitiesServices {

    static store = useGlobalStateStore();
    static userStore = useUserStore();

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

    static async getCommunitiesByManager(): Promise<string[]> {

        this.store.setIsLoading(true)
        let communities: string[] = [];
        try {
            const { data } = await apiServicesQps.get<Community[]>(`/communities/by-manager/${this.userStore?.userData?.id}`)
            data.map((community) => communities.push(community.id));
            return communities;
        } catch (error: any) {
            return []
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

    static async searchCommunity(searchWord: string, page: number = 1, take: number = 10): Promise<Community[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/communities/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getCommunityById(id: string): Promise<Community> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<Community>(`/communities/${id}`)
            return data
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async updateCommunity(communityId: string, changedValue: NewCommunity) {

        if (!communityId) return

        this.store.setIsLoading(true)

        try {
            const response = await apiServicesQps.patch(`/communities/${communityId}`, changedValue)
            return response.data;
        } catch (error: any) {
            console.log(error)
            throw error;
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async exportCommunityReport(communityId: string) {
        this.store.setIsLoading(true);
        try {
            console.log('1')
            const { data } = await apiServicesQps.get(`/reports/community/${communityId}`, {
                responseType: 'blob'
            });

            console.log('data desde comunidad',data)

            // const url = window.URL.createObjectURL(new Blob([data]));
            // const link = document.createElement('a');
            // link.href = url;
            // link.setAttribute('download', `community-report-${communityId}.xlsx`);
            // document.body.appendChild(link);
            // link.click();

            // document.body.removeChild(link);
            // window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Error exporting community report:", error);
            throw new Error(error);
        } finally {
            this.store.setIsLoading(false);
        }
    }

}