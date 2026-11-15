import { computed, reactive, ref, watch, type Ref } from 'vue';

import type { CalendarInterface } from '../../../interfaces/calendar/calendar.interface';
import type { User } from '../../../interfaces/users/users.interface';
import { UsersServices } from '../../users/users.services';
import { CalendarServices } from '../calendar.services';
import {
  computeBalance,
  computeWorkloads,
  isUnassignedService,
  normalizeDate,
  suggestAssignments,
  type AssignmentSuggestion,
  type BalancerCleaner,
  type BalancerService,
  type CleanerWorkload,
  type SuggestResult,
} from '../utils/load-balancer';

export const CLEANER_ROLE_ID = '4';
export const QA_ROLE_ID = '7';
/** Valor especial del filtro: solo servicios sin cleaner. */
export const UNASSIGNED_FILTER = '__unassigned__';

export interface ApplyProgress {
  done: number;
  total: number;
  failed: number;
}

export interface ApplyResult {
  ok: number;
  failed: { serviceId: string; cleanerName: string | null }[];
}

export const toBalancerService = (ev: CalendarInterface): BalancerService => ({
  id: String(ev.id),
  date: normalizeDate(ev.date),
  schedule: ev.schedule ?? null,
  userId: ev.userId ? String(ev.userId) : null,
  statusId: ev.statusId != null ? String(ev.statusId) : null,
  communityId: ev.communityId ? String(ev.communityId) : null,
  communityName: ev.community?.communityName ?? null,
  unitNumber: ev.unitNumber ?? null,
  typeName: ev.type?.cleaningType ?? null,
});

const todayYYYYMMDD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Estado reactivo del panel de carga y de las sugerencias de asignacion.
 * La logica (score, greedy) vive en utils/load-balancer.ts.
 */
export function useLoadBalancer(events: Ref<CalendarInterface[]>) {
  // -------------------------------------------------------------------------
  // Cleaners
  // -------------------------------------------------------------------------
  const users = ref<User[]>([]);
  const usersLoaded = ref(false);
  const includeQa = ref(false);

  const loadCleaners = async () => {
    let all: User[] = [];
    let page = 1;
    let hasNext = true;
    // Mismo patron que ServicesEditView: todas las paginas de usuarios activos.
    while (hasNext && page <= 40) {
      const response = await UsersServices.getUsers(page, 50, false, true);
      all = [...all, ...response.data];
      hasNext = Boolean(response.meta?.hasNextPage);
      page++;
    }
    users.value = all.filter((u) => u.roleId === CLEANER_ROLE_ID || u.roleId === QA_ROLE_ID);
    usersLoaded.value = true;
  };

  const allowedRoles = computed(() => (includeQa.value ? [CLEANER_ROLE_ID, QA_ROLE_ID] : [CLEANER_ROLE_ID]));

  /**
   * Cleaners del panel: los activos que trae /users y, ademas, cualquier
   * cleaner que aparezca en los servicios del mes pero no este activo
   * (se muestra, pero no entra al score ni a las sugerencias). Si /users no
   * devolvio nada (rol sin permiso) se arma la lista con los servicios.
   */
  const cleaners = computed<BalancerCleaner[]>(() => {
    const roles = new Set(allowedRoles.value);
    const map = new Map<string, BalancerCleaner>();
    const fromApi = users.value.length > 0;
    users.value
      .filter((u) => roles.has(String(u.roleId)))
      .forEach((u) => map.set(String(u.id), {
        id: String(u.id),
        name: u.name,
        roleId: String(u.roleId),
        active: u.isActive !== false,
      }));
    events.value.forEach((ev) => {
      const u = ev.user;
      if (!ev.userId || !u || map.has(String(ev.userId))) return;
      if (!roles.has(String(u.roleId))) return;
      map.set(String(ev.userId), { id: String(ev.userId), name: u.name, roleId: String(u.roleId), active: !fromApi });
    });
    return [...map.values()];
  });

  const balancerServices = computed(() => events.value.map(toBalancerService));

  // -------------------------------------------------------------------------
  // Carga y balance actual
  // -------------------------------------------------------------------------
  const workloads = computed<CleanerWorkload[]>(() => computeWorkloads(balancerServices.value, cleaners.value));
  const balance = computed(() => computeBalance(workloads.value));
  const unassignedCount = computed(() => balancerServices.value.filter(isUnassignedService).length);

  // -------------------------------------------------------------------------
  // Sugerencias
  // -------------------------------------------------------------------------
  const suggestionsActive = ref(false);
  const includePast = ref(false);
  const pinned = reactive<Record<string, string>>({});
  const skipped = ref<Set<string>>(new Set());

  const resetOverrides = () => {
    Object.keys(pinned).forEach((k) => delete pinned[k]);
    skipped.value = new Set();
  };

  const result = computed<SuggestResult | null>(() => {
    if (!suggestionsActive.value) return null;
    return suggestAssignments({
      services: balancerServices.value,
      cleaners: cleaners.value,
      pinned: { ...pinned },
      skipped: skipped.value,
      fromDate: includePast.value ? null : todayYYYYMMDD(),
    });
  });

  const suggestionByServiceId = computed(() => {
    const map = new Map<string, AssignmentSuggestion>();
    result.value?.suggestions.forEach((s) => {
      if (!s.skipped && s.cleanerId) map.set(s.serviceId, s);
    });
    return map;
  });

  const applicable = computed(() => result.value?.suggestions.filter((s) => !s.skipped && s.cleanerId) ?? []);

  const startSuggestions = () => {
    resetOverrides();
    suggestionsActive.value = true;
  };

  const clearSuggestions = () => {
    suggestionsActive.value = false;
    resetOverrides();
  };

  const pinCleaner = (serviceId: string, cleanerId: string | null) => {
    if (cleanerId) pinned[serviceId] = cleanerId;
    else delete pinned[serviceId];
  };

  const setSkipped = (serviceId: string, value: boolean) => {
    const next = new Set(skipped.value);
    if (value) next.add(serviceId);
    else next.delete(serviceId);
    skipped.value = next;
  };

  const isApplying = ref(false);
  const progress = ref<ApplyProgress>({ done: 0, total: 0, failed: 0 });

  /** Aplica las sugerencias indicadas (por defecto todas las no excluidas), de a pocas en paralelo. */
  const applySuggestions = async (rows: AssignmentSuggestion[] = applicable.value): Promise<ApplyResult> => {
    const queue = rows.filter((r) => r.cleanerId && !r.skipped);
    const failed: ApplyResult['failed'] = [];
    isApplying.value = true;
    progress.value = { done: 0, total: queue.length, failed: 0 };
    const CONCURRENCY = 3;
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const row = queue[cursor++];
        try {
          await CalendarServices.assignServiceToCleaner(row.serviceId, row.cleanerId!);
        } catch {
          failed.push({ serviceId: row.serviceId, cleanerName: row.cleanerName });
          progress.value = { ...progress.value, failed: progress.value.failed + 1 };
        } finally {
          progress.value = { ...progress.value, done: progress.value.done + 1 };
        }
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    } finally {
      isApplying.value = false;
    }
    return { ok: queue.length - failed.length, failed };
  };

  // Si el mes cambia y ya no hay nada que sugerir, se apagan las sugerencias.
  watch(unassignedCount, (count) => {
    if (count === 0 && suggestionsActive.value && !isApplying.value) clearSuggestions();
  });

  return {
    // cleaners
    users,
    usersLoaded,
    includeQa,
    loadCleaners,
    cleaners,
    // carga
    workloads,
    balance,
    unassignedCount,
    // sugerencias
    suggestionsActive,
    includePast,
    result,
    suggestionByServiceId,
    applicable,
    startSuggestions,
    clearSuggestions,
    resetOverrides,
    pinCleaner,
    setSkipped,
    applySuggestions,
    isApplying,
    progress,
  };
}

export type LoadBalancer = ReturnType<typeof useLoadBalancer>;
