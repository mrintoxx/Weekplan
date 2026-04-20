import { z } from 'zod';
import { dayPlanSchema, dayTemplateSchema, weekPlanSchema } from '@/lib/schemas';

export type DayTemplate = z.infer<typeof dayTemplateSchema>;
export type WeekPlan = z.infer<typeof weekPlanSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
