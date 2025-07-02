import { apiServicesQps } from "../../api/api";
import type { CalendarInterface } from "../../interfaces/calendar/calendar.interface";
import { useGlobalStateStore } from "../../store/auth.store";



export class CalendarServices {

    static store = useGlobalStateStore();

    static async getCalendarData(): Promise<CalendarInterface[]> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<CalendarInterface[]>(`/calendar?type=year`)
            return data
        } catch (error: any) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }


    static async getReviewItemsWithClasses(): Promise<any> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.get(`/reviews/items-with-classes`)
            return data
        } catch (error) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async postServiceReview(payload: {
        serviceId: string,
        message: string,
        reviewItems: { reviewItemId: string, value: boolean }[]
    }): Promise<any> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/reviews/service-review`, payload)
            return data
        } catch (error) {
            return null
        } finally {
            this.store.setIsLoading(false)
        }
    }



    






}