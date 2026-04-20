import type { CalendarEvent } from '@/types';
import { MockCalendarSource } from '@/lib/calendarSource';
import dayjs from 'dayjs';

const calendarSource = new MockCalendarSource();

export type CalendarSlice = {
  eventsByWeek: Record<string, CalendarEvent[]>;
  syncEvents: (from: string, to: string) => Promise<void>;
  getEventsForDay: (date: string) => CalendarEvent[];
};

type BoundState = CalendarSlice;

export function createCalendarSlice(
  set: (fn: (state: BoundState) => void) => void,
  get: () => BoundState,
): CalendarSlice {
  return {
    eventsByWeek: {},

    async syncEvents(from, to) {
      const events = await calendarSource.fetchEvents(from, to);
      set((state) => {
        // Group events by the weekStart of their start date
        const byWeek: Record<string, CalendarEvent[]> = {};
        for (const ev of events) {
          const d = dayjs(ev.start);
          const dow = d.day();
          const daysBack = dow === 0 ? 6 : dow - 1;
          const weekStart = d.subtract(daysBack, 'day').format('YYYY-MM-DD');
          if (!byWeek[weekStart]) byWeek[weekStart] = [];
          byWeek[weekStart].push(ev);
        }
        // Merge into eventsByWeek (overwrite fetched weeks)
        for (const [week, evs] of Object.entries(byWeek)) {
          state.eventsByWeek[week] = evs;
        }
      });
    },

    getEventsForDay(date) {
      const d = dayjs(date);
      const dayStart = d.startOf('day').valueOf();
      const dayEnd = d.endOf('day').valueOf();
      const allEvents = Object.values(get().eventsByWeek).flat();
      return allEvents.filter((ev) => {
        const evStart = new Date(ev.start).getTime();
        const evEnd = new Date(ev.end).getTime();
        // Overlaps the day if event starts before end-of-day and ends after start-of-day
        return evStart < dayEnd && evEnd > dayStart;
      });
    },
  };
}
