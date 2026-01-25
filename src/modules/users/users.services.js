import { apiServicesQps } from "../../api/api";
import { useGlobalStateStore } from "../../store/auth.store";
import genericNullObject from "../../utils/null-data-meta";
export class UsersServices {
    static async getUsers(page = 1, take = 10, filterCleaners = false) {
        const store = useGlobalStateStore();
        store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/users?page=${page}&take=${take}`);
            const filteredData = filterCleaners ? data.data.filter((user) => user.role.id === '4') : data.data;
            return {
                data: filteredData,
                meta: {
                    ...data.meta,
                }
            };
        }
        catch (error) {
            return {
                data: [],
                meta: genericNullObject.meta
            };
        }
        finally {
            store.setIsLoading(false);
        }
    }
    static async getUsersRoles() {
        const store = useGlobalStateStore();
        store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get('/users/roles');
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            store.setIsLoading(false);
        }
    }
    static async createUser(newUser) {
        try {
            await apiServicesQps.post(`/users`, newUser);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async deleteUser(userId) {
        try {
            await apiServicesQps.delete(`/users/${userId}`);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    static async searchUser(searchWord, page = 1, take = 10) {
        const store = useGlobalStateStore();
        store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.post(`/users/search?page=${page}&take=${take}`, { searchWord });
            return data;
        }
        catch (error) {
            return [];
        }
        finally {
            store.setIsLoading(false);
        }
    }
    static async getUserById(id) {
        const store = useGlobalStateStore();
        store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get(`/users/${id}`);
            return data;
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            store.setIsLoading(false);
        }
    }
    static async updateUser(userId, changedValue) {
        if (!userId)
            return;
        const store = useGlobalStateStore();
        store.setIsLoading(true);
        try {
            await apiServicesQps.patch(`/users/${userId}`, changedValue);
        }
        catch (error) {
            throw new Error(error);
        }
        finally {
            store.setIsLoading(false);
        }
    }
}
