import { apiServicesQps } from "../../api/api";
import type { Communities, Community, NewCommunity } from "../../interfaces/communities/communities.interface";
import type { NewUser, User, UserRoles, Users } from "../../interfaces/users/users.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class UsersServices {



    static async getUsers(page: number = 1, take: number = 10, filterCleaners: boolean = false): Promise<Users> {
        const store = useGlobalStateStore();
        store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get(`/users?page=${page}&take=${take}`)

            const filteredData = filterCleaners ? data.data.filter((user: any) => user.role.id === '4') : data.data;
            return {
                data: filteredData,
                meta: {
                    ...data.meta,
                }
            }
        } catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            }
        } finally {
           store.setIsLoading(false)
        }
    }

    static async getUsersRoles(): Promise<UserRoles[]> {

        const store = useGlobalStateStore();
        store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get('/users/roles')
            return data
        } catch (error) {
            return []
        } finally {
            store.setIsLoading(false)
        }
    }

    static async createUser(newUser: NewUser) {
        try {
            await apiServicesQps.post(`/users`, newUser)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async deleteUser(userId: string) {

        try {
            await apiServicesQps.delete(`/users/${userId}`)
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async searchUser(searchWord: string, page: number = 1, take: number = 10): Promise<User[]> {
        const store = useGlobalStateStore();
        store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/users/search?page=${page}&take=${take}`, { searchWord });
            return data
        } catch (error) {
            return []
        } finally {
            store.setIsLoading(false)
        }
    }

    static async getUserById(id: string): Promise<User> {
        const store = useGlobalStateStore();
        store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<User>(`/users/${id}`);
            return data;
        } catch (error: any) {
            throw new Error(error);
        } finally {
            store.setIsLoading(false);
        }
    }

    static async getActiveAssigneeIds(months: number = 3): Promise<string[]> {
        try {
            const { data } = await apiServicesQps.get(`/services/active-assignees?months=${months}`);
            return Array.isArray(data?.userIds) ? data.userIds : [];
        } catch (error) {
            return [];
        }
    }

    static async updateUser(userId: string, changedValue: NewUser) {
        if (!userId) return;
        const store = useGlobalStateStore();
        store.setIsLoading(true)

        try {
            await apiServicesQps.patch(`/users/${userId}`, changedValue);
        } catch (error: any) {
            throw new Error(error);
        } finally {
            store.setIsLoading(false);
        }
    }

}
