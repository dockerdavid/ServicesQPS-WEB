import { apiServicesQps } from '../../api/api';

export interface AuthMe {
    id: string;
    email: string;
    name: string;
    roleId: string | null;
    mustChangePassword: boolean;
}

export class AuthServices {
    static async getMe(): Promise<AuthMe> {
        const { data } = await apiServicesQps.get<AuthMe>('/auth/me');
        return data;
    }

    static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await apiServicesQps.post('/auth/change-password', { currentPassword, newPassword });
    }
}
