import type { WeekPlan, DayPlan, BlockInstance, DayTemplate, CalendarEvent } from '@/types';
import { instantiateTemplate } from '@/lib/templateEngine';
import { saveWeekPlan } from '@/store/persistence';
import { weekStartOf, formatISODate } from '@/lib/datetime';
import { logger } from '@/lib/logger';
import dayjs from 'dayjs';

export type WeekPlanSlice = {
  weekPlans: Record<string, WeekPlan>;
  getWeekPlan: (weekStart: string) => WeekPlan | undefined;
  upsertDayPlan: (weekStart: string, dayPlan: DayPlan) => void;
  addBlockInstance: (weekStart: string, date: string, instance: BlockInstance) => void;
  updateBlockInstance: (weekStart: string, date: string, instance: BlockInstance) => void;
  removeBlockInstance: (weekStart: string, date: string, instanceId: string) => void;
  setDayNote: (weekStart: string, date: string, note: string) => void;
  assignDayType: (date: string, dayTypeId: string) => void;
};

type SliceDeps = {
  templates: DayTemplate[];
  getEventsForDay: (date: string) => CalendarEvent[];
};

type BoundState = WeekPlanSlice & SliceDeps;

export function createWeekPlanSlice(
  set: (fn: (state: BoundState) => void) => void,
  get: () => BoundState,
): WeekPlanSlice {
  return {
    weekPlans: {},

    getWeekPlan(weekStart) {
      return get().weekPlans[weekStart];
    },

    upsertDayPlan(weekStart, dayPlan) {
      set((state) => {
        if (!state.weekPlans[weekStart]) {
          state.weekPlans[weekStart] = { weekStart, days: {} };
        }
        state.weekPlans[weekStart].days[dayPlan.date] = dayPlan;
      });
      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },

    addBlockInstance(weekStart, date, instance) {
      set((state) => {
        const day = state.weekPlans[weekStart]?.days[date];
        if (day) day.instances.push(instance);
      });
      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },

    updateBlockInstance(weekStart, date, instance) {
      set((state) => {
        const day = state.weekPlans[weekStart]?.days[date];
        if (!day) return;
        const idx = day.instances.findIndex((i) => i.id === instance.id);
        if (idx !== -1) day.instances.splice(idx, 1, instance);
      });
      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },

    removeBlockInstance(weekStart, date, instanceId) {
      set((state) => {
        const day = state.weekPlans[weekStart]?.days[date];
        if (day) day.instances = day.instances.filter((i) => i.id !== instanceId);
      });
      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },

    setDayNote(weekStart, date, note) {
      set((state) => {
        const day = state.weekPlans[weekStart]?.days[date];
        if (day) day.note = note;
      });
      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },

    assignDayType(date, dayTypeId) {
      const weekStart = formatISODate(weekStartOf(dayjs(date)));
      const state = get();
      const template = state.templates.find((t) => t.id === dayTypeId);

      if (!template) {
        logger.warn('Template not found for dayType', { dayTypeId, date });
        set((s) => {
          if (!s.weekPlans[weekStart]) {
            s.weekPlans[weekStart] = { weekStart, days: {} };
          }
          s.weekPlans[weekStart].days[date] = { date, dayType: dayTypeId, instances: [] };
        });
        return;
      }

      const events = state.getEventsForDay(date);
      const instances = instantiateTemplate(template, date, events);

      set((s) => {
        if (!s.weekPlans[weekStart]) {
          s.weekPlans[weekStart] = { weekStart, days: {} };
        }
        s.weekPlans[weekStart].days[date] = { date, dayType: dayTypeId, instances };
      });

      const plan = get().weekPlans[weekStart];
      if (plan) void saveWeekPlan(plan);
    },
  };
}
