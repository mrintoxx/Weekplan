import type { CalendarEvent } from '@/types';
import { toAbsoluteISO } from '@/lib/datetime';
import dayjs from 'dayjs';

// 5-day shift cycle (repeating, anchored to the Monday of the week containing `from`):
// offset 0: OFF          — no events
// offset 1: TRAVAIL      — Shift Jour 07:00–19:00
// offset 2: PRE-NIGHT    — Shift Nuit 19:00–07:00 J+1
// offset 3: POST-NIGHT   — no events
// offset 4: OFF          — no events
const CYCLE_LENGTH = 5;

function getMondayOf(date: dayjs.Dayjs): dayjs.Dayjs {
  const dow = date.day(); // 0=Sun, 1=Mon…6=Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  return date.subtract(daysFromMonday, 'day').startOf('day');
}

export interface CalendarSource {
  fetchEvents(from: string, to: string): Promise<CalendarEvent[]>;
}

export class MockCalendarSource implements CalendarSource {
  fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
    if (from >= to) return Promise.resolve([]);

    const events: CalendarEvent[] = [];
    const anchor = getMondayOf(dayjs(from));
    let current = dayjs(from);
    const end = dayjs(to);

    while (current.isBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      const daysDiff = current.startOf('day').diff(anchor.startOf('day'), 'day');
      const cycleOffset = ((daysDiff % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH;

      if (cycleOffset === 1) {
        events.push({
          id: `mock-${dateStr}-jour`,
          source: 'gcal',
          calendarId: 'mock-work',
          title: 'Shift Jour',
          start: toAbsoluteISO(dateStr, '07:00'),
          end: toAbsoluteISO(dateStr, '19:00'),
        });
      } else if (cycleOffset === 2) {
        const nextDateStr = current.add(1, 'day').format('YYYY-MM-DD');
        events.push({
          id: `mock-${dateStr}-nuit`,
          source: 'gcal',
          calendarId: 'mock-work',
          title: 'Shift Nuit',
          start: toAbsoluteISO(dateStr, '19:00'),
          end: toAbsoluteISO(nextDateStr, '07:00'),
        });
      }
      // offsets 0, 3, 4 : OFF / POST-NIGHT / OFF → aucun event

      current = current.add(1, 'day');
    }

    return Promise.resolve(
      events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    );
  }
}
