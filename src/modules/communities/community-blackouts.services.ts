import { apiServicesQps } from "../../api/api";
import type {
  CommunityBlackout,
  CreateBlackoutResult,
  NewCommunityBlackout,
} from "../../interfaces/communities/community-blackouts.interface";
import { getApiErrorMessage } from "../../utils/api-error-message";

export const BLACKOUT_PERIOD_LABELS: Record<string, string> = {
  full_day: 'Dia completo',
  am: 'Medio dia (AM, 00:00-12:00)',
  pm: 'Medio dia (PM, 12:00-24:00)',
  custom: 'Rango de horas',
};

/** Horario legible del bloqueo: 'Dia completo', 'AM (00:00-12:00)', '08:00-14:00'. */
export const describeBlackoutWindow = (b: Pick<CommunityBlackout, 'period' | 'startTime' | 'endTime'>) => {
  switch (b.period) {
    case 'full_day': return 'Dia completo';
    case 'am': return 'AM (00:00-12:00)';
    case 'pm': return 'PM (12:00-24:00)';
    case 'custom': return `${(b.startTime ?? '').slice(0, 5)}-${(b.endTime ?? '').slice(0, 5)}`;
    default: return b.period;
  }
};

export class CommunityBlackoutsServices {
  static async getBlackouts(filter: { communityId?: string; startDate?: string; endDate?: string } = {}): Promise<CommunityBlackout[]> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const { data } = await apiServicesQps.get<CommunityBlackout[]>(`/community-blackouts?${params}`);
    return data;
  }

  static async createBlackout(payload: NewCommunityBlackout): Promise<CreateBlackoutResult> {
    try {
      const { data } = await apiServicesQps.post<CreateBlackoutResult>('/community-blackouts', payload);
      return data;
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'No se pudo guardar el bloqueo.'));
    }
  }

  static async deleteBlackout(id: string): Promise<void> {
    try {
      await apiServicesQps.delete(`/community-blackouts/${id}`);
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error, 'No se pudo eliminar el bloqueo.'));
    }
  }
}
