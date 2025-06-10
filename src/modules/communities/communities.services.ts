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
            
            console.log('Received blob data:', data);
            
            if (!data || data.size === 0) {
                throw new Error('No data received from the server');
            }

            const blob = new Blob([data], { type: 'application/pdf' });
            console.log('Created blob:', blob);
            
            const url = window.URL.createObjectURL(blob);
            console.log('Created URL:', url);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte-comunidad-${communityId}.pdf`);
            link.style.display = 'none';
            document.body.appendChild(link);
            
            console.log('Triggering download...');
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('Cleanup completed');
            }, 100);
        } catch (error: any) {
            console.error("Error exporting community report:", error);
            throw new Error(error);
        }
    }
}