import { vi } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WeekPlan, DayPlan, BlockInstance, DayTemplate, CalendarEvent } from '@/types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/store/persistence', () => ({
  getWeekPlan: vi.fn().mockResolvedValue(undefined),
  saveWeekPlan: vi.fn().mockResolvedValue(undefined),
  getAllTemplates: vi.fn().mockResolvedValue([]),
  saveTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}));

const mockInstantiateTemplate = vi.fn();

vi.mock('@/lib/templateEngine', () => ({
  instantiateTemplate: (...args: unknown[]) => mockInstantiateTemplate(...args),
}));

import { createWeekPlanSlice, type WeekPlanSlice } from '@/store/slices/weekPlanSlice';

// ─── Minimal extra state needed by assignDayType ──────────────────────────────

type MinimalTemplatesState = {
  templates: DayTemplate[];
};

type MinimalCalendarState = {
  eventsByWeek: Record<string, CalendarEvent[]>;
  getEventsForDay: (date: string) => CalendarEvent[];
};

type TestStore = WeekPlanSlice & MinimalTemplatesState & MinimalCalendarState;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const WEEK_START = '2026-04-20';
const DATE_MON = '2026-04-20';
const DATE_TUE = '2026-04-21';

function makeInstance(overrides: Partial<BlockInstance> = {}): BlockInstance {
  return {
    id: 'inst-1',
    date: DATE_MON,
    start: '2026-04-20T07:00:00+02:00',
    end: '2026-04-20T08:00:00+02:00',
    label: 'Test bloc',
    category: 'perso',
    fixed: false,
    sourceTemplateId: 'off-lever',
    ...overrides,
  };
}

function makeDayPlan(overrides: Partial<DayPlan> = {}): DayPlan {
  return {
    date: DATE_MON,
    instances: [],
    ...overrides,
  };
}

function makeWeekPlan(overrides: Partial<WeekPlan> = {}): WeekPlan {
  return {
    weekStart: WEEK_START,
    days: {},
    ...overrides,
  };
}

const offTemplate: DayTemplate = {
  id: 'off',
  label: 'Jour off',
  blocks: [
    {
      id: 'off-lever',
      label: 'Lever',
      category: 'perso',
      start: '07:00',
      duration: 30,
    },
  ],
};

// ─── Store factory ────────────────────────────────────────────────────────────

function createTestStore(initialTemplates: DayTemplate[] = []) {
  return create<TestStore>()(
    immer((set, get) => {
      const weekPlanSlicePart = createWeekPlanSlice(set, get);
      return {
        ...weekPlanSlicePart,
        templates: initialTemplates,
        eventsByWeek: {},
        getEventsForDay: (_date: string): CalendarEvent[] => [],
      };
    }),
  );
}

// ─── T1.15 — Lecture et mutations simples ─────────────────────────────────────

describe('weekPlanSlice', () => {
  describe('getWeekPlan', () => {
    it('returns undefined when the week does not exist in state', () => {
      // Arrange
      const store = createTestStore();

      // Act
      const result = store.getState().getWeekPlan(WEEK_START);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('upsertDayPlan', () => {
    it('inserts a DayPlan into an existing WeekPlan', () => {
      // Arrange
      const store = createTestStore();
      store.setState((s) => {
        s.weekPlans[WEEK_START] = makeWeekPlan();
      });
      const dayPlan = makeDayPlan({ date: DATE_MON });

      // Act
      store.getState().upsertDayPlan(WEEK_START, dayPlan);

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      expect(week?.days[DATE_MON]).toEqual(dayPlan);
    });

    it('creates a new WeekPlan when it does not exist yet', () => {
      // Arrange
      const store = createTestStore();
      const dayPlan = makeDayPlan({ date: DATE_MON });

      // Act
      store.getState().upsertDayPlan(WEEK_START, dayPlan);

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      expect(week).toBeDefined();
      expect(week?.weekStart).toBe(WEEK_START);
      expect(week?.days[DATE_MON]).toEqual(dayPlan);
    });
  });

  describe('addBlockInstance', () => {
    it('appends a BlockInstance to the matching DayPlan', () => {
      // Arrange
      const store = createTestStore();
      store.getState().upsertDayPlan(WEEK_START, makeDayPlan({ date: DATE_MON }));
      const instance = makeInstance();

      // Act
      store.getState().addBlockInstance(WEEK_START, DATE_MON, instance);

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      expect(week?.days[DATE_MON]?.instances).toHaveLength(1);
      expect(week?.days[DATE_MON]?.instances[0]).toEqual(instance);
    });
  });

  describe('updateBlockInstance', () => {
    it('replaces the instance with matching id in the DayPlan', () => {
      // Arrange
      const store = createTestStore();
      const original = makeInstance({ id: 'inst-42', label: 'Original' });
      store.getState().upsertDayPlan(WEEK_START, makeDayPlan({ date: DATE_MON, instances: [original] }));
      const updated = makeInstance({ id: 'inst-42', label: 'Updated' });

      // Act
      store.getState().updateBlockInstance(WEEK_START, DATE_MON, updated);

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      const instances = week?.days[DATE_MON]?.instances ?? [];
      expect(instances).toHaveLength(1);
      expect(instances[0]?.label).toBe('Updated');
    });
  });

  describe('removeBlockInstance', () => {
    it('removes the instance with matching id from the DayPlan', () => {
      // Arrange
      const store = createTestStore();
      const inst = makeInstance({ id: 'to-remove' });
      store.getState().upsertDayPlan(WEEK_START, makeDayPlan({ date: DATE_MON, instances: [inst] }));

      // Act
      store.getState().removeBlockInstance(WEEK_START, DATE_MON, 'to-remove');

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      expect(week?.days[DATE_MON]?.instances).toHaveLength(0);
    });
  });

  describe('setDayNote', () => {
    it('updates the note field of the target DayPlan', () => {
      // Arrange
      const store = createTestStore();
      store.getState().upsertDayPlan(WEEK_START, makeDayPlan({ date: DATE_MON }));

      // Act
      store.getState().setDayNote(WEEK_START, DATE_MON, 'My note');

      // Assert
      const week = store.getState().getWeekPlan(WEEK_START);
      expect(week?.days[DATE_MON]?.note).toBe('My note');
    });
  });

  // ─── T1.16 — assignDayType ─────────────────────────────────────────────────

  describe('assignDayType', () => {
    beforeEach(() => {
      mockInstantiateTemplate.mockReset();
    });

    it('assigns dayType to the DayPlan for the given date', () => {
      // Arrange
      const store = createTestStore([offTemplate]);
      const fakeInstances: BlockInstance[] = [
        makeInstance({ id: 'fake-1', sourceTemplateId: 'off-lever' }),
        makeInstance({ id: 'fake-2', sourceTemplateId: 'off-sport' }),
      ];
      mockInstantiateTemplate.mockReturnValue(fakeInstances);

      // Act
      store.getState().assignDayType(DATE_TUE, 'off');

      // Assert
      const weekStart = '2026-04-20'; // Monday of the week containing DATE_TUE
      const week = store.getState().getWeekPlan(weekStart);
      expect(week?.days[DATE_TUE]?.dayType).toBe('off');
    });

    it('populates instances with sourceTemplateId set from instantiateTemplate result', () => {
      // Arrange
      const store = createTestStore([offTemplate]);
      const fakeInstances: BlockInstance[] = [
        makeInstance({ id: 'fake-1', sourceTemplateId: 'off-lever' }),
        makeInstance({ id: 'fake-2', sourceTemplateId: 'off-sport' }),
      ];
      mockInstantiateTemplate.mockReturnValue(fakeInstances);

      // Act
      store.getState().assignDayType(DATE_TUE, 'off');

      // Assert
      const weekStart = '2026-04-20';
      const week = store.getState().getWeekPlan(weekStart);
      const instances = week?.days[DATE_TUE]?.instances ?? [];
      expect(instances).toHaveLength(2);
      expect(instances.every((i) => i.sourceTemplateId !== undefined)).toBe(true);
    });

    it('leaves instances empty when the requested template does not exist in the store', () => {
      // Arrange — store has no templates at all
      const store = createTestStore([]);

      // Act
      store.getState().assignDayType(DATE_TUE, 'unknown-type');

      // Assert — instantiateTemplate must NOT have been called
      expect(mockInstantiateTemplate).not.toHaveBeenCalled();

      const weekStart = '2026-04-20';
      const week = store.getState().getWeekPlan(weekStart);
      expect(week?.days[DATE_TUE]?.instances).toHaveLength(0);
    });
  });
});
