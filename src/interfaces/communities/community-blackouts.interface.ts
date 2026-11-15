/** full_day = dia completo, am = 00:00-12:00, pm = 12:00-24:00, custom = rango [startTime, endTime). */
export type BlackoutPeriod = 'full_day' | 'am' | 'pm' | 'custom';

export interface CommunityBlackout {
  id: string;
  communityId: string;
  startDate: string;
  endDate: string;
  period: BlackoutPeriod;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt?: string;
  community?: { id: string; communityName: string } | null;
}

export interface NewCommunityBlackout {
  communityId?: string;
  communityIds?: string[];
  allCommunities?: boolean;
  startDate: string;
  endDate?: string;
  period: BlackoutPeriod;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface CreateBlackoutResult {
  blackouts: CommunityBlackout[];
  conflictingServices: { id: string; communityId: string; date: string; schedule: string | null; unitNumber: string }[];
}
