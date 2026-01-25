import { apiServicesQps } from "../../api/api";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class CompaniesServices {
    static store = useGlobalStateStore();
    static async getCompanies(page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/companies?page=${page}&take=${take}`);
            return data;
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            };
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async getCompanyById(id) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/companies/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async createCompany(companyName) {
        try {
            const { data } = await apiServicesQps.post('/companies', { companyName });
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async deleteCompany(companyId) {
        try {
            await apiServicesQps.delete(`/companies/${companyId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchCompany(searchWord, page = 1, take = 10) {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/companies/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
    static async updateCompany(companyId, changedValue) {
        if (!companyId)
            return;
        this.store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/companies/${companyId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            this.store.setIsLoading(false);
        }
    }
}
