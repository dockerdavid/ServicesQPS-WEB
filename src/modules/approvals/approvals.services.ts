import { apiServicesQps } from '../../api/api';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired';

export interface ApprovalUser {
  id: string;
  name: string;
}

export interface Approval {
  id: string;
  code: string;
  method: string;
  url: string;
  body: unknown;
  userId: string;
  summary: string;
  status: ApprovalStatus;
  decidedByUserId: string | null;
  decisionChannel: 'sms' | 'web' | null;
  comment: string | null;
  decidedAt: string | null;
  resultStatus: number | null;
  error: string | null;
  executedAt: string | null;
  createdAt: string;
  user?: ApprovalUser | null;
  decidedByUser?: ApprovalUser | null;
}

export interface ApprovalsPage {
  data: Approval[];
  meta: { page: number; take: number; totalCount: number; pageCount: number };
}

export class ApprovalsServices {
  /** El API filtra por rol: super admin ve todas, Admin Papel solo las suyas. */
  static async list(page = 1, take = 20, status?: ApprovalStatus | null): Promise<ApprovalsPage> {
    const params = new URLSearchParams({ page: String(page), take: String(take) });
    if (status) params.set('status', status);
    const { data } = await apiServicesQps.get<ApprovalsPage>(`/approvals?${params}`);
    return data;
  }

  static async approve(id: string, comment?: string): Promise<Approval> {
    const { data } = await apiServicesQps.post<Approval>(`/approvals/${id}/approve`, comment ? { comment } : {});
    return data;
  }

  static async reject(id: string, comment?: string): Promise<Approval> {
    const { data } = await apiServicesQps.post<Approval>(`/approvals/${id}/reject`, comment ? { comment } : {});
    return data;
  }
}
