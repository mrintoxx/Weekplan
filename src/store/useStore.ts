import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createWeekPlanSlice, type WeekPlanSlice } from '@/store/slices/weekPlanSlice';
import { createTemplatesSlice, type TemplatesSlice } from '@/store/slices/templatesSlice';
import { createCalendarSlice, type CalendarSlice } from '@/store/slices/calendarSlice';
import { createUiSlice, type UiSlice } from '@/store/slices/uiSlice';
import { getWeekPlan as dbGetWeekPlan, getAllTemplates } from '@/store/persistence';
import { safeParseWith } from '@/lib/schemas';
import { weekPlanSchema, dayTemplateSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { weekStartOf, formatISODate } from '@/lib/datetime';
import dayjs from 'dayjs';

export type StoreState = WeekPlanSlice & TemplatesSlice & CalendarSlice & UiSlice;

export const useStore = create<StoreState>()(
  immer((set, get) => ({
    ...createWeekPlanSlice(set, get),
    ...createTemplatesSlice(set, get),
    ...createCalendarSlice(set, get),
    ...createUiSlice(set, get),
  })),
);

export async function initializeStore(): Promise<void> {
  const today = dayjs();
  const currentWeekStart = formatISODate(weekStartOf(today));
  const prevWeekStart = formatISODate(weekStartOf(today.subtract(7, 'day')));
  const nextWeekStart = formatISODate(weekStartOf(today.add(7, 'day')));

  // Load templates from IDB
  const rawTemplates = await getAllTemplates();
  const validTemplates = rawTemplates
    .map((t) => safeParseWith(dayTemplateSchema, t))
    .filter((t): t is NonNullable<typeof t> => t !== null);

  if (validTemplates.length === 0) {
    // First startup: seed defaults
    useStore.getState().resetToDefaults();
  } else {
    useStore.setState((s) => { s.templates = validTemplates; });
  }

  // Load week plans for current and adjacent weeks
  const weekStarts = [prevWeekStart, currentWeekStart, nextWeekStart];
  for (const weekStart of weekStarts) {
    const raw = await dbGetWeekPlan(weekStart);
    if (raw) {
      const parsed = safeParseWith(weekPlanSchema, raw);
      if (parsed) {
        useStore.setState((s) => { s.weekPlans[weekStart] = parsed; });
      } else {
        logger.warn('Corrupted WeekPlan in IDB, ignored', { weekStart });
      }
    }
  }

  // Sync mock calendar events for the 2 weeks around today
  const syncFrom = prevWeekStart;
  const syncTo = formatISODate(today.add(8, 'day'));
  await useStore.getState().syncEvents(syncFrom, syncTo);

  if (import.meta.env.DEV) {
    window.__store__ = useStore;
  }
}
