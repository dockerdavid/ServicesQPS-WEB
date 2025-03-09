import { apiServicesQps } from "@/api/api";
import type { CalendarInterface } from "@/interfaces/calendar/calendar.interface";
import { useGlobalStateStore } from "@/store/auth.store";



export class CalendarServices {

    static store = useGlobalStateStore();

    static async getCalendarData(): Promise<CalendarInterface[]> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<CalendarInterface[]>(`/calendar?type=month`)
            return data
        } catch (error: any) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

}