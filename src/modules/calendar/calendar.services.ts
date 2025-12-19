import { apiServicesQps } from "../../api/api";
import type { CalendarInterface } from "../../interfaces/calendar/calendar.interface";
import { useGlobalStateStore } from "../../store/auth.store";



export class CalendarServices {

    static store = useGlobalStateStore();

    static async getCalendarData(year?: number, month?: number): Promise<CalendarInterface[]> {

        this.store.setIsLoading(true)

        try {
            // Si no se proporcionan año y mes, usar el mes actual por defecto
            const currentDate = new Date()
            const currentYear = year ?? currentDate.getFullYear()
            const currentMonth = month ?? (currentDate.getMonth() + 1) // getMonth() retorna 0-11, necesitamos 1-12

            const { data } = await apiServicesQps.get<CalendarInterface[]>(`/calendar/by-month?year=${currentYear}&month=${currentMonth}`)
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