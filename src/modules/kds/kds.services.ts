import { apiServicesQps } from '../../api/api';
import { useGlobalStateStore } from '../../store/auth.store';
import type { CalendarInterface } from '../../interfaces/calendar/calendar.interface';

export type KdsDay = 'monday' | 'wednesday' | 'friday';

export interface KdsWeekResponse {
    weekOf: string;
    assigned: CalendarInterface[];
    unassigned: CalendarInterface[];
}

export class KdsServices {
    static store = useGlobalStateStore();

    static async getWeekServices(weekOf: string): Promise<KdsWeekResponse> {
        this.store.setIsLoading(true);
        try {
            const { data } = await apiServicesQps.get<KdsWeekResponse>(`/services/kds/week?weekOf=${weekOf}`);
            return data;
        } catch {
            return { weekOf, assigned: [], unassigned: [] };
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

    static async unassignService(id: string): Promise<void> {
        await apiServicesQps.patch(`/services/${id}/kds`, { kdsDay: null, kdsOrder: null, kdsWeekOf: null });
    }
}
