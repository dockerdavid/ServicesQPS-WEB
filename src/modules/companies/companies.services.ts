import { apiServicesQps } from "../../api/api";
import type { Communities, Community } from "../../interfaces/communities/communities.interface";
import type { Companies, Company, UpdateCompany } from "../../interfaces/companies/companies.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class CompaniesServices {

    static store = useGlobalStateStore();

    static async getCompanies(page: number = 1, take: number = 10): Promise<Companies> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/companies?page=${page}&take=${take}`)
            return data
        } catch (error) {
<<<<<<< HEAD
            console.log(error)
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async getCompanyById(id: string): Promise<Company> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<Company>(`/companies/${id}`)
            return data
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async createCompany(companyName: string) {
        try {
            const { data } = await apiServicesQps.post('/companies', { companyName })
<<<<<<< HEAD
            console.log(data)
=======
>>>>>>> 2b926e5a844007937b043a854ffb7d83b30c19e6
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async deleteCompany(companyId: string) {

        try {
            await apiServicesQps.delete(`/companies/${companyId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchCompany(searchWord: string, page: number = 1, take: number = 10): Promise<Company[]> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/companies/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async updateCompany(companyId: string, changedValue: UpdateCompany) {

        if (!companyId) return

        this.store.setIsLoading(true)

        try {
            await apiServicesQps.patch(`/companies/${companyId}`, changedValue)
        } catch (error: any) {
            throw new Error(error)
        } finally {
            this.store.setIsLoading(false)
        }
    }


}