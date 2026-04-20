import type { CalendarEvent } from '@/types';
import { toAbsoluteISO } from '@/lib/datetime';
import dayjs from 'dayjs';

export interface CalendarSource {
  fetchEvents(from: string, to: string): Promise<CalendarEvent[]>;
}

export class MockCalendarSource implements CalendarSource {
  fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
    if (from >= to) return Promise.resolve([]);

    const events: CalendarEvent[] = [];
    let current = dayjs(from);
    const end = dayjs(to);

    while (current.isBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      const nextDateStr = current.add(1, 'day').format('YYYY-MM-DD');

      const jourStart = toAbsoluteISO(dateStr, '07:00');
      const jourEnd = toAbsoluteISO(dateStr, '19:00');
      // nuitStart uses the same string as jourEnd so gap === 0 (string equality)
      const nuitEnd = toAbsoluteISO(nextDateStr, '07:00');

      events.push({
        id: `mock-${dateStr}-jour`,
        source: 'gcal',
        calendarId: 'mock-work',
        title: 'Shift Jour',
        start: jourStart,
        end: jourEnd,
      });

      events.push({
        id: `mock-${dateStr}-nuit`,
        source: 'gcal',
        calendarId: 'mock-work',
        title: 'Shift Nuit',
        start: jourEnd,
        end: nuitEnd,
      });

      current = current.add(1, 'day');
    }

    return Promise.resolve(
      events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    );
  }
}
