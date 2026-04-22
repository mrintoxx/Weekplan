import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createCalendarSlice, type CalendarSlice } from '@/store/slices/calendarSlice';

// Dates anchored to Monday 2026-04-20.
// MockCalendarSource cycle (anchor = 2026-04-20):
//   2026-04-20 Mon offset 0 → OFF
//   2026-04-21 Tue offset 1 → Shift Jour (mock-2026-04-21-jour)
//   2026-04-22 Wed offset 2 → Shift Nuit 19:00→07:00 (mock-2026-04-22-nuit)
//   2026-04-23 Thu offset 3 → no event
//   2026-04-24 Fri offset 4 → no event
//   2026-04-25 Sat offset 0 → no event
//   2026-04-26 Sun offset 1 → Shift Jour (mock-2026-04-26-jour)

const WEEK_MON = '2026-04-20';
const FROM = '2026-04-20';
const TO = '2026-04-27';

function createTestStore() {
  return create<CalendarSlice>()(
    immer((set, get) => createCalendarSlice(set, get)),
  );
}

describe('calendarSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('initial state', () => {
    it('starts with an empty eventsByWeek', () => {
      expect(store.getState().eventsByWeek).toEqual({});
    });
  });

  describe('syncEvents', () => {
    it('populates eventsByWeek with events grouped by week start', async () => {
      await store.getState().syncEvents(FROM, TO);

      const { eventsByWeek } = store.getState();
      expect(eventsByWeek[WEEK_MON]).toBeDefined();
      expect(eventsByWeek[WEEK_MON]!.length).toBeGreaterThan(0);
    });

    it('assigns each event to the week start of its start date', async () => {
      await store.getState().syncEvents(FROM, TO);

      const weekEvents = store.getState().eventsByWeek[WEEK_MON] ?? [];
      expect(weekEvents.some((e) => e.id === 'mock-2026-04-21-jour')).toBe(true);
      expect(weekEvents.some((e) => e.id === 'mock-2026-04-22-nuit')).toBe(true);
      expect(weekEvents.some((e) => e.id === 'mock-2026-04-26-jour')).toBe(true);
    });

    it('overwrites an existing week entry on re-sync (no duplication)', async () => {
      await store.getState().syncEvents(FROM, TO);
      const countFirst = store.getState().eventsByWeek[WEEK_MON]?.length ?? 0;

      await store.getState().syncEvents(FROM, TO);
      const countSecond = store.getState().eventsByWeek[WEEK_MON]?.length ?? 0;

      expect(countSecond).toBe(countFirst);
    });

    it('returns early and leaves state empty when from >= to', async () => {
      await store.getState().syncEvents('2026-04-22', '2026-04-20');

      expect(store.getState().eventsByWeek).toEqual({});
    });
  });

  describe('getEventsForDay', () => {
    beforeEach(async () => {
      await store.getState().syncEvents(FROM, TO);
    });

    it('returns the Shift Jour event for its day', () => {
      const events = store.getState().getEventsForDay('2026-04-21');
      expect(events.some((e) => e.id === 'mock-2026-04-21-jour')).toBe(true);
    });

    it('returns the Shift Nuit event for its start day', () => {
      const events = store.getState().getEventsForDay('2026-04-22');
      expect(events.some((e) => e.id === 'mock-2026-04-22-nuit')).toBe(true);
    });

    it('returns the Shift Nuit event for its end day (cross-midnight overlap)', () => {
      const events = store.getState().getEventsForDay('2026-04-23');
      expect(events.some((e) => e.id === 'mock-2026-04-22-nuit')).toBe(true);
    });

    it('returns an empty array for a day with no events', () => {
      const events = store.getState().getEventsForDay('2026-04-20');
      expect(events).toHaveLength(0);
    });
  });
});
