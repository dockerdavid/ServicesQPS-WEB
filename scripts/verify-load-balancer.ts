/**
 * Verificacion del balanceador de carga del calendario.
 * El proyecto web no tiene runner de tests: se corre con Node (>= 22.18 / 23.6
 * quitan los tipos de TypeScript solos):
 *
 *   npm run test:balancer      (o: node scripts/verify-load-balancer.ts)
 *
 * Vive fuera de src/ para que vue-tsc no lo tome (usa tipos de Node).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  balanceScoreFromCounts,
  computeBalance,
  computeWorkloads,
  gradeForScore,
  isUnassignedService,
  normalizeDate,
  parseScheduleMinutes,
  suggestAssignments,
  type BalancerCleaner,
  type BalancerService,
} from '../src/modules/calendar/utils/load-balancer.ts';

const cleaners: BalancerCleaner[] = [
  { id: 'a', name: 'Ana', roleId: '4', active: true },
  { id: 'b', name: 'Beto', roleId: '4', active: true },
  { id: 'c', name: 'Carla', roleId: '4', active: true },
];

let seq = 0;
const svc = (partial: Partial<BalancerService>): BalancerService => ({
  id: partial.id ?? `s${++seq}`,
  date: '2026-11-10',
  schedule: null,
  userId: null,
  statusId: '1',
  communityId: 'c1',
  communityName: 'Oak Park',
  ...partial,
});

test('parseScheduleMinutes acepta formatos de la API', () => {
  assert.equal(parseScheduleMinutes('08:30:00'), 510);
  assert.equal(parseScheduleMinutes('8:05'), 485);
  assert.equal(parseScheduleMinutes('2:15 PM'), 855);
  assert.equal(parseScheduleMinutes('12:00 am'), 0);
  assert.equal(parseScheduleMinutes(''), null);
  assert.equal(parseScheduleMinutes(null), null);
  assert.equal(parseScheduleMinutes('sin hora'), null);
});

test('normalizeDate no corre la fecha por zona horaria', () => {
  assert.equal(normalizeDate('2026-11-10T00:00:00.000Z'), '2026-11-10');
  assert.equal(normalizeDate('2026-11-10'), '2026-11-10');
  assert.equal(normalizeDate(new Date(Date.UTC(2026, 10, 3))), '2026-11-03');
});

test('isUnassignedService: sin cleaner y no cerrado', () => {
  assert.equal(isUnassignedService({ userId: null, statusId: '1' }), true);
  assert.equal(isUnassignedService({ userId: '', statusId: '4' }), true);
  assert.equal(isUnassignedService({ userId: 'a', statusId: '1' }), false);
  assert.equal(isUnassignedService({ userId: null, statusId: '6' }), false);
  assert.equal(isUnassignedService({ userId: null, statusId: '5' }), false);
});

test('balanceScoreFromCounts', () => {
  assert.equal(balanceScoreFromCounts([]), null);
  assert.equal(balanceScoreFromCounts([0, 0, 0]), null);
  assert.equal(balanceScoreFromCounts([5, 5, 5]), 100);
  assert.equal(balanceScoreFromCounts([7]), 100);
  // [10, 0]: cv = 1 -> 0
  assert.equal(balanceScoreFromCounts([10, 0]), 0);
  const mid = balanceScoreFromCounts([6, 4, 5])!;
  assert.ok(mid > 75 && mid < 100, `score esperado alto, fue ${mid}`);
  assert.equal(gradeForScore(80), 'good');
  assert.equal(gradeForScore(60), 'fair');
  assert.equal(gradeForScore(10), 'poor');
  assert.equal(gradeForScore(null), 'empty');
});

test('computeWorkloads y computeBalance detectan sobrecarga', () => {
  const services = [
    ...Array.from({ length: 8 }, (_, i) => svc({ userId: 'a', date: `2026-11-0${(i % 4) + 1}` })),
    svc({ userId: 'b', date: '2026-11-02' }),
    svc({ userId: 'b', date: '2026-11-02' }),
    svc({ userId: 'b', date: '2026-11-03', communityId: 'c2' }),
    svc({ userId: 'zzz' }), // usuario fuera de la lista: se ignora
  ];
  const workloads = computeWorkloads(services, cleaners);
  const ana = workloads.find((w) => w.cleanerId === 'a')!;
  const beto = workloads.find((w) => w.cleanerId === 'b')!;
  const carla = workloads.find((w) => w.cleanerId === 'c')!;
  assert.equal(ana.total, 8);
  assert.equal(ana.daysWorked, 4);
  assert.equal(ana.maxPerDay, 2);
  assert.equal(ana.busiestDay, '2026-11-01');
  assert.equal(beto.total, 3);
  assert.equal(beto.maxPerDay, 2);
  assert.equal(beto.communities, 2);
  assert.equal(carla.total, 0);
  assert.equal(ana.level, 'over');
  assert.equal(carla.level, 'idle');

  const balance = computeBalance(workloads);
  assert.equal(balance.poolSize, 3);
  assert.equal(balance.totalAssigned, 11);
  assert.deepEqual(balance.overloaded.map((w) => w.cleanerId), ['a']);
  assert.ok(balance.underloaded.some((w) => w.cleanerId === 'c'));
  assert.equal(balance.grade, 'poor');
});

test('los inactivos no entran al score ni reciben sugerencias', () => {
  const withInactive = [...cleaners, { id: 'x', name: 'Xavier', roleId: '4', active: false }];
  const result = suggestAssignments({
    services: [svc({}), svc({}), svc({}), svc({})],
    cleaners: withInactive,
  });
  assert.ok(result.suggestions.every((s) => s.cleanerId !== 'x'));
  assert.ok(result.suggestions.every((s) => s.candidates.every((c) => c.cleanerId !== 'x')));
});

test('greedy reparte servicios del mismo dia entre cleaners distintos', () => {
  const services = [svc({ id: 'u1' }), svc({ id: 'u2' }), svc({ id: 'u3' })];
  const result = suggestAssignments({ services, cleaners });
  const chosen = result.suggestions.map((s) => s.cleanerId);
  assert.equal(new Set(chosen).size, 3, `se esperaban 3 cleaners distintos: ${chosen}`);
  assert.equal(result.projectedScore, 100);
});

test('prefiere al cleaner con menos carga en el rango', () => {
  const services = [
    svc({ userId: 'a', date: '2026-11-01', communityId: 'otra' }),
    svc({ userId: 'a', date: '2026-11-02', communityId: 'otra' }),
    svc({ userId: 'b', date: '2026-11-03', communityId: 'otra' }),
    svc({ id: 'target', date: '2026-11-20' }),
  ];
  const result = suggestAssignments({ services, cleaners });
  assert.equal(result.suggestions[0].cleanerId, 'c');
  assert.ok((result.projectedScore ?? 0) > (result.currentScore ?? 0));
});

test('la carga del mismo dia pesa mas que la del rango', () => {
  // Ana: 4 en el rango, ninguno el dia 20. Beto: 1 en el rango, pero el dia 20.
  const services = [
    ...['01', '02', '03', '04'].map((d) => svc({ userId: 'a', date: `2026-11-${d}` })),
    svc({ userId: 'b', date: '2026-11-20' }),
    svc({ id: 'target', date: '2026-11-20' }),
  ];
  const result = suggestAssignments({ services, cleaners: cleaners.slice(0, 2) });
  assert.equal(result.suggestions[0].cleanerId, 'a');
});

test('penaliza el choque de horario', () => {
  // Ambos tienen 1 servicio ese dia; el de Ana choca a la misma hora.
  const services = [
    svc({ userId: 'a', schedule: '09:00:00', communityId: 'c9' }),
    svc({ userId: 'b', schedule: '15:00:00', communityId: 'c9' }),
    svc({ id: 'target', schedule: '09:30:00' }),
  ];
  const result = suggestAssignments({ services, cleaners: cleaners.slice(0, 2) });
  const target = result.suggestions[0];
  assert.equal(target.cleanerId, 'b');
  const ana = target.candidates.find((c) => c.cleanerId === 'a')!;
  assert.equal(ana.clashes, 1);
});

test('la familiaridad desempata a favor de quien ya conoce la comunidad', () => {
  const services = [
    svc({ userId: 'a', date: '2026-11-01', communityId: 'otra' }),
    svc({ userId: 'b', date: '2026-11-01', communityId: 'c1' }),
    svc({ id: 'target', date: '2026-11-15', communityId: 'c1', communityName: 'Oak Park' }),
  ];
  const result = suggestAssignments({ services, cleaners: cleaners.slice(0, 2) });
  assert.equal(result.suggestions[0].cleanerId, 'b');
  assert.match(result.suggestions[0].reason, /conoce Oak Park/);
});

test('la familiaridad no gana contra una diferencia de carga de 2 o mas', () => {
  const services = [
    ...['01', '02'].map((d) => svc({ userId: 'b', date: `2026-11-${d}`, communityId: 'c1' })),
    svc({ id: 'target', date: '2026-11-15', communityId: 'c1' }),
  ];
  const result = suggestAssignments({ services, cleaners: cleaners.slice(0, 2) });
  assert.equal(result.suggestions[0].cleanerId, 'a');
});

test('ordena por fecha y hora y es determinista', () => {
  const services = [
    svc({ id: 'late', date: '2026-11-12', schedule: '14:00' }),
    svc({ id: 'early', date: '2026-11-11' }),
    svc({ id: 'morning', date: '2026-11-12', schedule: '08:00' }),
    svc({ id: 'nohour', date: '2026-11-12' }),
  ];
  const r1 = suggestAssignments({ services, cleaners });
  const r2 = suggestAssignments({ services: [...services].reverse(), cleaners });
  assert.deepEqual(r1.suggestions.map((s) => s.serviceId), ['early', 'morning', 'late', 'nohour']);
  assert.deepEqual(r1.suggestions.map((s) => s.cleanerId), r2.suggestions.map((s) => s.cleanerId));
});

test('respeta elecciones manuales y recalcula el resto', () => {
  const services = [svc({ id: 'u1' }), svc({ id: 'u2' })];
  const auto = suggestAssignments({ services, cleaners: cleaners.slice(0, 2) });
  assert.equal(auto.suggestions[0].cleanerId, 'a');
  assert.equal(auto.suggestions[1].cleanerId, 'b');

  const manual = suggestAssignments({ services, cleaners: cleaners.slice(0, 2), pinned: { u1: 'b' } });
  assert.equal(manual.suggestions[0].cleanerId, 'b');
  assert.equal(manual.suggestions[0].pinned, true);
  assert.match(manual.suggestions[0].reason, /manualmente/);
  assert.equal(manual.suggestions[1].cleanerId, 'a');
});

test('las filas excluidas no suman carga', () => {
  const services = [svc({ id: 'u1' }), svc({ id: 'u2' })];
  const result = suggestAssignments({ services, cleaners: cleaners.slice(0, 2), skipped: ['u1'] });
  assert.equal(result.suggestions[0].skipped, true);
  // u1 no cuenta, entonces u2 tambien va a Ana (empate -> nombre).
  assert.equal(result.suggestions[1].cleanerId, 'a');
  assert.equal(result.projectedLoad.a, 1);
  assert.equal(result.projectedLoad.b, 0);
});

test('fromDate omite servicios pasados', () => {
  const services = [svc({ id: 'past', date: '2026-11-01' }), svc({ id: 'future', date: '2026-11-20' })];
  const result = suggestAssignments({ services, cleaners, fromDate: '2026-11-15' });
  assert.deepEqual(result.suggestions.map((s) => s.serviceId), ['future']);
  assert.deepEqual(result.omittedPast.map((s) => s.id), ['past']);
});

test('sin cleaners activos no revienta', () => {
  const result = suggestAssignments({ services: [svc({})], cleaners: [] });
  assert.equal(result.suggestions[0].cleanerId, null);
  assert.match(result.suggestions[0].reason, /No hay cleaners/);
  assert.equal(result.projectedScore, null);
});

test('mes grande: reparte de forma pareja', () => {
  const pool: BalancerCleaner[] = Array.from({ length: 6 }, (_, i) => ({
    id: `k${i}`, name: `Cleaner ${i}`, roleId: '4', active: true,
  }));
  const services: BalancerService[] = [];
  // Carga inicial desbalanceada: k0 con 10, k1 con 5.
  for (let i = 0; i < 10; i++) services.push(svc({ userId: 'k0', date: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  for (let i = 0; i < 5; i++) services.push(svc({ userId: 'k1', date: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  // 45 sin asignar repartidos en 15 dias, 3 por dia con horarios.
  for (let d = 1; d <= 15; d++) {
    for (const h of ['08:00', '10:00', '13:00']) {
      services.push(svc({ date: `2026-11-${String(d).padStart(2, '0')}`, schedule: h, communityId: `c${d % 4}` }));
    }
  }
  const result = suggestAssignments({ services, cleaners: pool });
  assert.equal(result.suggestions.length, 45);
  const loads = Object.values(result.projectedLoad);
  assert.ok(Math.max(...loads) - Math.min(...loads) <= 3, `cargas: ${loads}`);
  assert.ok((result.projectedScore ?? 0) >= 90, `score ${result.projectedScore}`);
  // Nadie recibe dos servicios que choquen el mismo dia.
  assert.ok(result.suggestions.every((s) => (s.chosen?.clashes ?? 0) === 0));
});
