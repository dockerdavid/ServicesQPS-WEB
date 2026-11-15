/**
 * Balanceo de carga de cleaners para el calendario.
 *
 * Todo lo de este archivo es logica pura (sin Vue, sin red, sin imports) para
 * poder probarlo con `node` directamente:
 *   npm run test:balancer   (scripts/verify-load-balancer.ts)
 *
 * Conceptos:
 *  - "Carga" de un cleaner = servicios asignados a el en el rango visible del
 *    calendario (el mes cargado, o la parte del rango de fechas que cae en el).
 *  - Score de balance (0-100) = 100 * (1 - coeficiente de variacion) de los
 *    servicios por cleaner activo. 100 = todos con la misma carga.
 *  - Sugerencias: algoritmo greedy que recorre los servicios sin cleaner en
 *    orden de fecha/hora y elige, para cada uno, el cleaner de menor costo.
 *    Cada eleccion se suma a la carga antes de evaluar el siguiente servicio,
 *    asi el reparto queda equilibrado aunque haya muchos servicios el mismo dia.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface BalancerService {
  id: string;
  /** Fecha del servicio en formato YYYY-MM-DD. */
  date: string;
  /** Hora tal como la guarda la API ("HH:mm:ss"), o null si no tiene. */
  schedule?: string | null;
  userId?: string | null;
  statusId?: string | null;
  communityId?: string | null;
  communityName?: string | null;
  unitNumber?: string | null;
  typeName?: string | null;
}

export interface BalancerCleaner {
  id: string;
  name: string;
  roleId: string;
  /** Solo los cleaners activos entran al score y reciben sugerencias. */
  active: boolean;
}

export type LoadLevel = 'over' | 'under' | 'ok' | 'idle';

export interface CleanerWorkload {
  cleanerId: string;
  name: string;
  roleId: string;
  active: boolean;
  total: number;
  daysWorked: number;
  maxPerDay: number;
  busiestDay: string | null;
  perDay: Record<string, number>;
  communities: number;
  /** total - promedio del pool (solo significativo para activos). */
  deviation: number;
  level: LoadLevel;
}

export type BalanceGrade = 'good' | 'fair' | 'poor' | 'empty';

export interface BalanceSummary {
  score: number | null;
  grade: BalanceGrade;
  mean: number;
  stdDev: number;
  cv: number;
  poolSize: number;
  totalAssigned: number;
  overloaded: CleanerWorkload[];
  underloaded: CleanerWorkload[];
}

export interface BalancerWeights {
  /** Costo por cada servicio que el cleaner ya tiene ese mismo dia. */
  sameDay: number;
  /** Costo por cada servicio que el cleaner tiene en todo el rango. */
  range: number;
  /** Costo por cada choque de horario (mismo dia y hora cercana). */
  clash: number;
  /** Descuento si el cleaner ya trabajo esa comunidad en el rango. */
  familiarity: number;
  /** Minutos de separacion por debajo de los cuales dos servicios chocan. */
  clashWindowMinutes: number;
}

export const DEFAULT_WEIGHTS: BalancerWeights = {
  sameDay: 10,
  range: 1,
  clash: 30,
  familiarity: 1.5,
  clashWindowMinutes: 120,
};

export interface CandidateScore {
  cleanerId: string;
  name: string;
  cost: number;
  dayLoad: number;
  rangeLoad: number;
  clashes: number;
  familiar: boolean;
}

export interface AssignmentSuggestion {
  serviceId: string;
  service: BalancerService;
  cleanerId: string | null;
  cleanerName: string | null;
  /** Candidato elegido (null si no habia cleaners). */
  chosen: CandidateScore | null;
  /** Todos los cleaners del pool ordenados del mejor al peor. */
  candidates: CandidateScore[];
  reason: string;
  /** El admin eligio el cleaner a mano (se respeta y no se recalcula). */
  pinned: boolean;
  /** El admin excluyo esta fila: no se aplica ni cuenta para la carga. */
  skipped: boolean;
}

export interface SuggestOptions {
  /** Todos los servicios del rango (asignados y sin asignar). */
  services: BalancerService[];
  /** Cleaners candidatos; los inactivos se ignoran. */
  cleaners: BalancerCleaner[];
  /** serviceId -> cleanerId elegido a mano. */
  pinned?: Record<string, string>;
  /** serviceIds que no se quieren asignar. */
  skipped?: Iterable<string>;
  /** Solo se sugieren servicios con fecha >= fromDate (YYYY-MM-DD). */
  fromDate?: string | null;
  weights?: Partial<BalancerWeights>;
}

export interface SuggestResult {
  suggestions: AssignmentSuggestion[];
  /** Servicios sin cleaner que quedaron fuera por ser anteriores a fromDate. */
  omittedPast: BalancerService[];
  currentScore: number | null;
  projectedScore: number | null;
  /** Carga por cleaner si se aplican todas las sugerencias no excluidas. */
  projectedLoad: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Estados en los que el servicio ya no se reparte (completed / finished). */
const CLOSED_STATUS_IDS = new Set(['5', '6']);

/** Servicio sin cleaner que todavia se puede asignar. */
export function isUnassignedService(service: Pick<BalancerService, 'userId' | 'statusId'>): boolean {
  return !service.userId && !CLOSED_STATUS_IDS.has(String(service.statusId ?? ''));
}

/** Normaliza cualquier fecha de la API a YYYY-MM-DD sin correrla por zona horaria. */
export function normalizeDate(value: unknown): string {
  if (typeof value === 'string' && value.length >= 10) return value.substring(0, 10);
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Convierte la hora del servicio a minutos desde medianoche.
 * Acepta "HH:mm", "HH:mm:ss", "h:mm AM/PM". Devuelve null si no hay hora.
 */
export function parseScheduleMinutes(schedule: string | null | undefined): number | null {
  if (!schedule) return null;
  const match = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?/i.exec(String(schedule).trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase().replace(/\./g, '');
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function compareServices(a: BalancerService, b: BalancerService): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ma = parseScheduleMinutes(a.schedule);
  const mb = parseScheduleMinutes(b.schedule);
  // Los que tienen hora van primero: son los que pueden chocar.
  if (ma !== mb) {
    if (ma === null) return 1;
    if (mb === null) return -1;
    return ma - mb;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------
// Score de balance
// ---------------------------------------------------------------------------

/**
 * Score 0-100 a partir del coeficiente de variacion (desv. estandar / promedio)
 * de la cantidad de servicios por cleaner. null si no hay nada que medir.
 */
export function balanceScoreFromCounts(counts: number[]): number | null {
  if (counts.length === 0) return null;
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return null;
  if (counts.length === 1) return 100;
  const mean = total / counts.length;
  const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round(100 * (1 - cv))));
}

export const GRADE_LABELS: Record<BalanceGrade, string> = {
  good: 'Balanceado',
  fair: 'Regular',
  poor: 'Desbalanceado',
  empty: 'Sin datos',
};

export function gradeForScore(score: number | null): BalanceGrade {
  if (score === null) return 'empty';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/** Un cleaner esta sobrecargado / con poca carga si se aleja >25% y al menos 2 servicios del promedio. */
function levelFor(total: number, mean: number, active: boolean): LoadLevel {
  if (!active) return total === 0 ? 'idle' : 'ok';
  if (total === 0) return 'idle';
  const diff = total - mean;
  if (diff >= 2 && total > mean * 1.25) return 'over';
  if (-diff >= 2 && total < mean * 0.75) return 'under';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Carga por cleaner
// ---------------------------------------------------------------------------

/**
 * Calcula la carga de cada cleaner de la lista con los servicios dados.
 * Los servicios de usuarios que no estan en la lista se ignoran.
 */
export function computeWorkloads(services: BalancerService[], cleaners: BalancerCleaner[]): CleanerWorkload[] {
  const byCleaner = new Map<string, { perDay: Record<string, number>; communities: Set<string>; total: number }>();
  cleaners.forEach((c) => byCleaner.set(c.id, { perDay: {}, communities: new Set(), total: 0 }));

  for (const s of services) {
    if (!s.userId) continue;
    const acc = byCleaner.get(String(s.userId));
    if (!acc) continue;
    acc.total += 1;
    acc.perDay[s.date] = (acc.perDay[s.date] ?? 0) + 1;
    if (s.communityId) acc.communities.add(String(s.communityId));
  }

  const activeTotals = cleaners.filter((c) => c.active).map((c) => byCleaner.get(c.id)!.total);
  const mean = activeTotals.length ? activeTotals.reduce((a, b) => a + b, 0) / activeTotals.length : 0;

  return cleaners.map((c) => {
    const acc = byCleaner.get(c.id)!;
    let maxPerDay = 0;
    let busiestDay: string | null = null;
    for (const [day, count] of Object.entries(acc.perDay)) {
      if (count > maxPerDay || (count === maxPerDay && busiestDay !== null && day < busiestDay)) {
        maxPerDay = count;
        busiestDay = day;
      }
    }
    return {
      cleanerId: c.id,
      name: c.name,
      roleId: c.roleId,
      active: c.active,
      total: acc.total,
      daysWorked: Object.keys(acc.perDay).length,
      maxPerDay,
      busiestDay,
      perDay: acc.perDay,
      communities: acc.communities.size,
      deviation: round1(acc.total - mean),
      level: levelFor(acc.total, mean, c.active),
    };
  });
}

/** Resumen del balance considerando solo los cleaners activos. */
export function computeBalance(workloads: CleanerWorkload[]): BalanceSummary {
  const pool = workloads.filter((w) => w.active);
  const counts = pool.map((w) => w.total);
  const totalAssigned = counts.reduce((a, b) => a + b, 0);
  const mean = pool.length ? totalAssigned / pool.length : 0;
  const variance = pool.length ? counts.reduce((s, c) => s + (c - mean) ** 2, 0) / pool.length : 0;
  const stdDev = Math.sqrt(variance);
  const score = balanceScoreFromCounts(counts);
  return {
    score,
    grade: gradeForScore(score),
    mean: round1(mean),
    stdDev: round1(stdDev),
    cv: mean > 0 ? Math.round((stdDev / mean) * 100) / 100 : 0,
    poolSize: pool.length,
    totalAssigned,
    overloaded: pool.filter((w) => w.level === 'over').sort((a, b) => b.total - a.total),
    underloaded: pool
      .filter((w) => w.level === 'under' || (w.level === 'idle' && mean >= 2))
      .sort((a, b) => a.total - b.total),
  };
}

// ---------------------------------------------------------------------------
// Sugerencias (greedy)
// ---------------------------------------------------------------------------

interface LoadState {
  range: Map<string, number>;
  day: Map<string, number>;
  slots: Map<string, number[]>;
  community: Map<string, number>;
}

const dayKey = (cleanerId: string, date: string) => `${cleanerId}|${date}`;
const communityKey = (cleanerId: string, communityId: string) => `${cleanerId}|${communityId}`;

function addLoad(state: LoadState, cleanerId: string, s: BalancerService) {
  state.range.set(cleanerId, (state.range.get(cleanerId) ?? 0) + 1);
  const dk = dayKey(cleanerId, s.date);
  state.day.set(dk, (state.day.get(dk) ?? 0) + 1);
  const minutes = parseScheduleMinutes(s.schedule);
  if (minutes !== null) {
    const list = state.slots.get(dk) ?? [];
    list.push(minutes);
    state.slots.set(dk, list);
  }
  if (s.communityId) {
    const ck = communityKey(cleanerId, String(s.communityId));
    state.community.set(ck, (state.community.get(ck) ?? 0) + 1);
  }
}

function scoreCandidate(
  state: LoadState,
  cleaner: BalancerCleaner,
  s: BalancerService,
  w: BalancerWeights,
): CandidateScore {
  const dk = dayKey(cleaner.id, s.date);
  const dayLoad = state.day.get(dk) ?? 0;
  const rangeLoad = state.range.get(cleaner.id) ?? 0;
  const minutes = parseScheduleMinutes(s.schedule);
  const clashes = minutes === null
    ? 0
    : (state.slots.get(dk) ?? []).filter((m) => Math.abs(m - minutes) < w.clashWindowMinutes).length;
  const familiarCount = s.communityId ? state.community.get(communityKey(cleaner.id, String(s.communityId))) ?? 0 : 0;
  const familiar = familiarCount > 0;
  const cost = w.sameDay * dayLoad + w.range * rangeLoad + w.clash * clashes - (familiar ? w.familiarity : 0);
  return { cleanerId: cleaner.id, name: cleaner.name, cost: round1(cost), dayLoad, rangeLoad, clashes, familiar };
}

function compareCandidates(a: CandidateScore, b: CandidateScore): number {
  if (a.cost !== b.cost) return a.cost - b.cost;
  if (a.rangeLoad !== b.rangeLoad) return a.rangeLoad - b.rangeLoad;
  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) return byName;
  return a.cleanerId < b.cleanerId ? -1 : 1;
}

/** Texto corto que explica por que se eligio ese cleaner. */
export function describeCandidate(c: CandidateScore, s: BalancerService, pinned = false): string {
  const parts: string[] = [];
  if (pinned) parts.push('Elegido manualmente');
  parts.push(c.dayLoad === 0 ? 'Libre ese día' : `Ya tiene ${c.dayLoad} ese día`);
  parts.push(`${c.rangeLoad} en el rango`);
  if (c.clashes > 0) parts.push(`choque de horario (${c.clashes})`);
  if (c.familiar) parts.push(`conoce ${s.communityName || 'la comunidad'}`);
  return parts.join(' · ');
}

/**
 * Propone un cleaner para cada servicio sin asignar del rango.
 *
 * Costo de un candidato = sameDay*cargaDelDia + range*cargaDelRango
 *                        + clash*choquesDeHorario - familiarity(si conoce la comunidad)
 * Se elige el de menor costo; empates: menos carga en el rango, luego nombre.
 */
export function suggestAssignments(options: SuggestOptions): SuggestResult {
  const w: BalancerWeights = { ...DEFAULT_WEIGHTS, ...(options.weights ?? {}) };
  const pool = options.cleaners.filter((c) => c.active);
  const poolIds = new Set(pool.map((c) => c.id));
  const pinned = options.pinned ?? {};
  const skipped = new Set(options.skipped ?? []);

  const state: LoadState = { range: new Map(), day: new Map(), slots: new Map(), community: new Map() };
  pool.forEach((c) => state.range.set(c.id, 0));

  // Carga existente (servicios que ya tienen cleaner del pool).
  for (const s of options.services) {
    if (s.userId && poolIds.has(String(s.userId))) addLoad(state, String(s.userId), s);
  }
  const currentScore = balanceScoreFromCounts(pool.map((c) => state.range.get(c.id) ?? 0));

  const unassigned = options.services.filter(isUnassignedService).sort(compareServices);
  const omittedPast = options.fromDate ? unassigned.filter((s) => s.date < options.fromDate!) : [];
  const targets = options.fromDate ? unassigned.filter((s) => s.date >= options.fromDate!) : unassigned;

  const suggestions: AssignmentSuggestion[] = targets.map((s) => {
    const isSkipped = skipped.has(s.id);
    const candidates = pool.map((c) => scoreCandidate(state, c, s, w)).sort(compareCandidates);
    const pinnedId = pinned[s.id];
    const pinnedCandidate = pinnedId ? candidates.find((c) => c.cleanerId === pinnedId) ?? null : null;
    const chosen = pinnedCandidate ?? candidates[0] ?? null;

    if (chosen && !isSkipped) addLoad(state, chosen.cleanerId, s);

    return {
      serviceId: s.id,
      service: s,
      cleanerId: chosen?.cleanerId ?? null,
      cleanerName: chosen?.name ?? null,
      chosen,
      candidates,
      reason: isSkipped
        ? 'Excluido: no se asignará'
        : chosen
          ? describeCandidate(chosen, s, Boolean(pinnedCandidate))
          : 'No hay cleaners activos disponibles',
      pinned: Boolean(pinnedCandidate),
      skipped: isSkipped,
    };
  });

  const projectedLoad: Record<string, number> = {};
  pool.forEach((c) => { projectedLoad[c.id] = state.range.get(c.id) ?? 0; });

  return {
    suggestions,
    omittedPast,
    currentScore,
    projectedScore: balanceScoreFromCounts(pool.map((c) => projectedLoad[c.id])),
    projectedLoad,
  };
}
