import { useUserStore } from "../../../src/store/user.store";
import { apiServicesQps } from "../../api/api";
import type { Communities, Community, NewCommunity } from "../../interfaces/communities/communities.interface";
import genericNullObject from "../../utils/null-data-meta";

export class CommunitiesServices {
    static userStore = useUserStore();

    static async getCommunities(page: number = 1, take: number = 10): Promise<Communities> {
        try {
            const { data } = await apiServicesQps.get<Communities>(`/communities?page=${page}&take=${take}`)
            return data
        } catch (error: any) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
        }
    }

    static async getCommunitiesByManager(): Promise<string[]> {
        let communities: string[] = [];
        try {
            const { data } = await apiServicesQps.get<Community[]>(`/communities/by-manager/${this.userStore?.userData?.id}`)
            data.map((community) => communities.push(community.id));
            return communities;
        } catch (error: any) {
            return []
        }
    }

    static async createCommunity(community: NewCommunity) {
        try {
            const { data } = await apiServicesQps.post(`/communities`, community)
        } catch (error: any) {
            throw new Error(error)
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
        try {
            const { data } = await apiServicesQps.post(`/communities/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        }
    }

    static async getCommunityById(id: string): Promise<Community> {
        try {
            const { data } = await apiServicesQps.get<Community>(`/communities/${id}`)
            return data
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async updateCommunity(communityId: string, changedValue: NewCommunity) {
        if (!communityId) return

        try {
            const response = await apiServicesQps.patch(`/communities/${communityId}`, changedValue)
            return response.data;
        } catch (error: any) {
            console.log(error)
            throw error;
        }
    }

    static async exportCommunityReport(communityId: string) {
        try {
            const { data } = await apiServicesQps.get(`/reports/community/${communityId}`, {
                responseType: 'blob'
            });
            return data;
        } catch (error: any) {
            console.error("Error exporting community report:", error);
            throw new Error(error);
        }
    }
}