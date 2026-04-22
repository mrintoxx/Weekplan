import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@/store/persistence', () => ({
  getWeekPlan: vi.fn().mockResolvedValue(undefined),
  saveWeekPlan: vi.fn().mockResolvedValue(undefined),
  getAllTemplates: vi.fn().mockResolvedValue([]),
  saveTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { initializeStore, useStore } from '@/store/useStore';

// System time fixed to Monday 2026-04-20.
// MockCalendarSource with this anchor produces events on:
//   2026-04-20 Mon offset 2 → Shift Nuit (mock-2026-04-20-nuit)  [anchor from 2026-04-13]
//   2026-04-24 Fri offset 1 → Shift Jour (mock-2026-04-24-jour)
//   2026-04-25 Sat offset 2 → Shift Nuit (mock-2026-04-25-nuit)
// So eventsByWeek['2026-04-20'] is non-empty after initializeStore().

const FAKE_TODAY = new Date('2026-04-20T10:00:00Z');
const CURRENT_WEEK = '2026-04-20';

describe('initializeStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FAKE_TODAY);
    useStore.setState({ eventsByWeek: {}, weekPlans: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('populates eventsByWeek for the current week on startup', async () => {
    await initializeStore();

    const { eventsByWeek } = useStore.getState();
    expect(eventsByWeek[CURRENT_WEEK]).toBeDefined();
    expect(eventsByWeek[CURRENT_WEEK]!.length).toBeGreaterThan(0);
  });

  it('also syncs adjacent weeks so navigation works immediately', async () => {
    await initializeStore();

    const { eventsByWeek } = useStore.getState();
    const weekKeys = Object.keys(eventsByWeek);
    // At least one week besides the current week should be populated
    expect(weekKeys.length).toBeGreaterThan(1);
  });
});
