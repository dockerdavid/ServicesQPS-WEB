import { apiServicesQps } from "../../api/api";
import type { CalendarInterface, RefreshPhotoUpload, RefreshPhotosRound } from "../../interfaces/calendar/calendar.interface";
import type { GeoPayload } from "../../composables/useGeolocation";
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

    static async getCalendarDataByRange(startDate: string, endDate: string): Promise<CalendarInterface[]> {

        this.store.setIsLoading(true)

        try {
            const { data } = await apiServicesQps.get<CalendarInterface[]>(`/calendar/by-range?startDate=${startDate}&endDate=${endDate}`)
            return data
        } catch (error: any) {
            return []
        } finally {
            this.store.setIsLoading(false)
        }
    }


    /**
     * Asigna un servicio a un cleaner desde las sugerencias del calendario.
     * Es el mismo PATCH /services/:id que usa la edicion del servicio: con
     * statusId '2' (Pending) la API marca assignedAt/assignedByUserId y
     * manda la notificacion de "asignado". No toca el loading global para que
     * el lote muestre su propio progreso.
     */
    static async assignServiceToCleaner(serviceId: string, userId: string): Promise<void> {
        await apiServicesQps.patch(`/services/${serviceId}`, { userId, statusId: '2' });
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

    static async toggleQaFlag(serviceId: string, qaFlagged: boolean): Promise<void> {
        await apiServicesQps.patch(`/services/${serviceId}/qa-flag`, { qaFlagged });
    }

    static async postQAStart(serviceId: string, location: GeoPayload): Promise<any> {
        try {
            const { data } = await apiServicesQps.post(`/reviews/qa-start/${serviceId}`, location)
            return data
        } catch (error) {
            return null
        }
    }

    /**
     * Revision de QA. Metodologia nueva: sin checklist; si `refreshPhotos`
     * trae 1 o mas fotos (photoPath del upload) el servicio va a refresh, si
     * no se aprueba. `reviewItems` queda solo por compatibilidad.
     * Lanza el error para que el modal pueda avisar y no cerrar.
     */
    static async postServiceReview(payload: {
        serviceId: string,
        message?: string,
        refreshPhotos?: string[],
        reviewItems?: { reviewItemId: string, value: boolean }[],
        latitude?: number,
        longitude?: number,
        accuracy?: number,
        altitude?: number,
        altitudeAccuracy?: number,
        heading?: number,
        speed?: number,
        capturedAt?: string,
        meta?: Record<string, any>,
    }): Promise<any> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.post(`/reviews/service-review`, payload)
            return data
        } finally {
            this.store.setIsLoading(false)
        }
    }

    static async uploadRefreshPhoto(file: File): Promise<RefreshPhotoUpload> {
        const payload = new FormData();
        payload.append('file', file);
        const { data } = await apiServicesQps.post<RefreshPhotoUpload>(`/reviews/photos/upload`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async getRefreshPhotos(serviceId: string): Promise<RefreshPhotosRound[]> {
        const { data } = await apiServicesQps.get<{ rounds: RefreshPhotosRound[] }>(`/reviews/service/${serviceId}/refresh-photos`);
        return Array.isArray(data?.rounds) ? data.rounds : [];
    }

    static async getQADailyTracking(): Promise<any> {
        this.store.setIsLoading(true)
        try {
            const { data } = await apiServicesQps.get(`/reviews/qa-tracking/daily`)
            return data
        } catch (error) {
            throw error
        } finally {
            this.store.setIsLoading(false)
        }
    }



    






}