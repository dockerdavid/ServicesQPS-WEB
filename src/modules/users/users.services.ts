import { apiServicesQps } from "../../api/api";
import type { Communities, Community, NewCommunity } from "../../interfaces/communities/communities.interface";
import type { NewUser, User, UserRoles, Users } from "../../interfaces/users/users.interface";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";


export class UsersServices {



    /** `roleId` lo resuelve el API: el tope de `take` es 150, asi que filtrar por
     *  rol en el navegador deja fuera a los usuarios mas nuevos en cuanto la
     *  tabla pasa de ese numero. */
    static async getUsers(page: number = 1, take: number = 10, filterCleaners: boolean = false, activeOnly: boolean = false, roleId?: string, status?: 'active' | 'inactive' | 'all', zone?: 'none' | 'assigned'): Promise<Users> {
        const store = useGlobalStateStore();
        store.setIsLoading(true)

        try {
            const params = new URLSearchParams({ page: String(page), take: String(take) });
            if (activeOnly) params.set('activeOnly', 'true');
            if (roleId) params.set('roleId', roleId);
            if (status) params.set('status', status);
            if (zone) params.set('zone', zone);
            const { data } = await apiServicesQps.get(`/users?${params}`)

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

    static async searchUser(searchWord: string, page: number = 1, take: number = 10, roleId?: string, status?: 'active' | 'inactive' | 'all', zone?: 'none' | 'assigned'): Promise<User[]> {
        const store = useGlobalStateStore();
        store.setIsLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page), take: String(take) });
            if (roleId) params.set('roleId', roleId);
            if (status) params.set('status', status);
            if (zone) params.set('zone', zone);
            const { data } = await apiServicesQps.post(`/users/search?${params}`, { searchWord });
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

    static async updateUserIsActive(userId: string, isActive: boolean) {
        if (!userId) return;
        try {
            await apiServicesQps.patch(`/users/${userId}`, { isActive });
        } catch (error: any) {
            throw new Error(error);
        }
    }

    /** Pide a un usuario que cree una clave nueva en su próximo uso. */
    static async requirePasswordChange(userId: string) {
        const { data } = await apiServicesQps.post(`/users/${userId}/require-password-change`);
        return data;
    }

    static async cancelPasswordChange(userId: string) {
        const { data } = await apiServicesQps.delete(`/users/${userId}/require-password-change`);
        return data;
    }

    /** Todos los usuarios ACTIVOS del rol (ej. '4' = cleaners). Devuelve { affected } o 202 de aprobación. */
    static async requirePasswordChangeForRole(roleId: string): Promise<{ affected?: number; roleName?: string; pendingApproval?: boolean }> {
        const { data } = await apiServicesQps.post('/users/require-password-change', { roleId });
        return data;
    }

    /** Cantidad de usuarios activos de un rol (para el diálogo de confirmación). */
    static async countActiveByRole(roleId: string): Promise<number> {
        const params = new URLSearchParams({ page: '1', take: '1', roleId, status: 'active' });
        const { data } = await apiServicesQps.get(`/users?${params}`);
        return Number(data?.meta?.totalCount ?? 0);
    }
}
