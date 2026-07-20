import { apiServicesQps } from '../../api/api';
import { useGlobalStateStore } from '../../store/auth.store';
import type { CalendarInterface } from '../../interfaces/calendar/calendar.interface';

export type KdsDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export const KDS_DAYS: KdsDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const KDS_DAY_LABELS: Record<KdsDay, string> = {
    monday: 'LUNES',
    tuesday: 'MARTES',
    wednesday: 'MIÉRCOLES',
    thursday: 'JUEVES',
    friday: 'VIERNES',
};

export interface KdsWeekResponse {
    weekOf: string;
    assigned: CalendarInterface[];
    unassigned: CalendarInterface[];
    limbo: CalendarInterface[];
    limboCount: number;
}

export class KdsServices {
    static store = useGlobalStateStore();

    static async getWeekServices(weekOf: string): Promise<KdsWeekResponse> {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get<KdsWeekResponse>(`/services/kds/week?weekOf=${weekOf}`);
            return data;
        } catch {
            return { weekOf, assigned: [], unassigned: [], limbo: [], limboCount: 0 };
        } finally {
            this.store.setIsLoading(false);
        }
    }

    static async assignService(
        id: string,
        kdsDay: KdsDay,
        kdsOrder: number,
        kdsWeekOf: string,
    ): Promise<void> {
        await apiServicesQps.patch(`/services/${id}/kds`, { kdsDay, kdsOrder, kdsWeekOf });
    }

    static async assignServiceToDay(id: string, kdsDay: KdsDay): Promise<void> {
        // Order and week are auto-computed by the API (end of that day's queue, current week)
        await apiServicesQps.patch(`/services/${id}/kds`, { kdsDay });
    }

    static async unassignService(id: string): Promise<void> {
        await apiServicesQps.patch(`/services/${id}/kds`, { kdsDay: null, kdsOrder: null, kdsWeekOf: null });
    }

    static async getPendingServicesForUser(userId: string): Promise<CalendarInterface[]> {
        const { data } = await apiServicesQps.get(`/services/by-user/${userId}/2?take=50&page=1`);
        return data?.data ?? [];
    }

    static async acceptService(id: string): Promise<void> {
        await apiServicesQps.patch(`/services/${id}`, { statusId: '3' });
    }
}
