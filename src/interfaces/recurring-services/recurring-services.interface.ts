import type { MetaPagination } from '../meta-pagination.interface';

export interface RecurringService {
  id: string;
  communityId: string;
  typeId: string;
  statusId: string;
  userId?: string | null;
  unitySize: string;
  unitNumber: string;
  schedule?: string | null;
  comment?: string | null;
  userComment?: string | null;
  daysOfWeek: string[];
  extraIds?: string[] | null;
  startDate: string;
  isActive: boolean;
  community?: { communityName?: string | null };
  type?: { cleaningType?: string | null; description?: string | null };
  status?: { statusName?: string | null };
  user?: { name?: string | null };
}

export interface RecurringServices {
  data: RecurringService[];
  meta: MetaPagination;
}

export interface NewRecurringService {
  communityId: string;
  typeId: string;
  statusId: string;
  unitySize: string;
  unitNumber: string;
  schedule?: string | null;
  comment?: string | null;
  userComment?: string | null;
  userId?: string | null;
  daysOfWeek: string[];
  extraIds?: string[] | null;
  isActive?: boolean;
}
