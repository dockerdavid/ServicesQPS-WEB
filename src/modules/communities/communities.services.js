import { useUserStore } from "../../../src/store/user.store";
import { apiServicesQps } from "../../api/api";
import genericNullObject from "../../utils/null-data-meta";
export class CommunitiesServices {
    static userStore = useUserStore();
    static async getCommunities(page = 1, take = 10) {
        try {
            const { data } = await apiServicesQps.get(`/communities?page=${page}&take=${take}`);
            return data;
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            };
        }
    }
    static async getCommunitiesByManager() {
        let communities = [];
        try {
            const { data } = await apiServicesQps.get(`/communities/by-manager/${this.userStore?.userData?.id}`);
            data.map((community) => communities.push(community.id));
            return communities;
        }
        catch (error) {
            return [];
        }
    }
    static async createCommunity(community) {
        try {
            const { data } = await apiServicesQps.post(`/communities`, community);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async deleteCommunity(communityId) {
        try {
            await apiServicesQps.delete(`/communities/${communityId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchCommunity(searchWord, page = 1, take = 10) {
        try {
            const { data } = await apiServicesQps.post(`/communities/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
    }
    static async getCommunityById(id) {
        try {
            const { data } = await apiServicesQps.get(`/communities/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async updateCommunity(communityId, changedValue) {
        if (!communityId)
            return;
        try {
            const response = await apiServicesQps.patch(`/communities/${communityId}`, changedValue);
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    static async exportCommunityReport(communityId) {
        try {
            const { data } = await apiServicesQps.get(`/reports/community/${communityId}`, {
                responseType: 'blob'
            });
            if (!data || data.size === 0) {
                throw new Error('No data received from the server');
            }
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte-comunidad-${communityId}.pdf`);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        }
        catch (error) {
            console.error("Error exporting community report:", error);
            throw new Error(error);
        }
    }
}
