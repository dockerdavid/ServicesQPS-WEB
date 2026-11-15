import type { EventInput, EventSourceInput } from '@fullcalendar/core/index.js';

import { CommunityBlackoutsServices, describeBlackoutWindow } from '../communities/community-blackouts.services';
import type { CommunityBlackout } from '../../interfaces/communities/community-blackouts.interface';
import './blackout-events.css';

/** Marca de los eventos de fondo, para distinguirlos de los servicios. */
export const BLACKOUT_EVENT_KIND = 'community-blackout';

export const isBlackoutEvent = (event: any) => event?.extendedProps?.kind === BLACKOUT_EVENT_KIND;

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Contenido del evento de fondo (el titulo viene de datos: se escapa). */
export const blackoutEventContent = (event: any) => ({
  html: `<div class="fc-blackout-label">${escapeHtml(String(event?.title ?? ''))}</div>`,
});

const toYmd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** FullCalendar usa fin exclusivo en eventos de dia completo. */
const addOneDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return toYmd(new Date(y, m - 1, d + 1));
};

/**
 * Un evento de fondo por bloqueo "igual" (mismas fechas, horario y motivo):
 * si se aplico Thanksgiving a 40 comunidades sale una sola franja con
 * "(40 comunidades)" y los nombres en el tooltip, no 40 franjas apiladas.
 */
export const blackoutsToEvents = (blackouts: CommunityBlackout[]): EventInput[] => {
  const groups = new Map<string, CommunityBlackout[]>();
  for (const b of blackouts) {
    const key = [b.startDate, b.endDate, b.period, b.startTime, b.endTime, b.reason ?? ''].join('|');
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const names = group.map((b) => b.community?.communityName ?? `Comunidad ${b.communityId}`);
    const who = group.length === 1 ? names[0] : `${group.length} comunidades`;
    const window = first.period === 'full_day' ? '' : ` ${describeBlackoutWindow(first)}`;
    const reason = first.reason ? ` (${first.reason})` : '';
    return {
      id: `blackout-${first.id}`,
      title: `${who}: fuera de servicio${window}${reason}`,
      start: first.startDate,
      end: addOneDay(first.endDate),
      allDay: true,
      display: 'background',
      classNames: ['fc-community-blackout'],
      extendedProps: { kind: BLACKOUT_EVENT_KIND, communities: names },
    };
  });
};

/** Fuente de eventos de fondo con los dias fuera de servicio del rango visible. */
export const blackoutEventSource: EventSourceInput = {
  id: 'community-blackouts',
  events: async (info: { start: Date; end: Date }) => {
    try {
      const blackouts = await CommunityBlackoutsServices.getBlackouts({
        startDate: toYmd(info.start),
        endDate: toYmd(info.end),
      });
      return blackoutsToEvents(blackouts);
    } catch {
      return [];
    }
  },
  color: '#f59e0b',
};
