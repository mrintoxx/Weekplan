import { z } from 'zod';

export const blockCategorySchema = z.enum([
  'sport',
  'reno',
  'bebe',
  'repos',
  'perso',
  'travail',
  'transition',
  'homelab',
  'famille',
]);

export const dayTypeSchema = z.union([
  z.enum(['off', 'pre-night', 'post-night', 'work']),
  z.string(),
]);

export const calendarEventSchema = z.object({
  id: z.string(),
  source: z.literal('gcal'),
  calendarId: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string().optional(),
  color: z.string().optional(),
});

export const blockTemplateSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: blockCategorySchema,
  start: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z
    .number()
    .int()
    .refine((n) => n % 15 === 0, { message: 'duration must be a multiple of 15' }),
  fixed: z.boolean().optional(),
  allowOverlap: z.boolean().optional(),
  notes: z.string().optional(),
});

export const blockInstanceSchema = z.object({
  id: z.string(),
  date: z.string(),
  start: z.string(),
  end: z.string(),
  label: z.string(),
  category: blockCategorySchema,
  sourceTemplateId: z.string().optional(),
  fixed: z.boolean(),
  notes: z.string().optional(),
});

export const dayTemplateSchema = z.object({
  id: dayTypeSchema,
  label: z.string(),
  description: z.string().optional(),
  blocks: z.array(blockTemplateSchema),
  autoDetect: z
    .object({
      titlePattern: z.string(),
      calendarIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export const dayPlanSchema = z.object({
  date: z.string(),
  dayType: dayTypeSchema.optional(),
  dayTypeManual: z.boolean().optional(),
  instances: z.array(blockInstanceSchema),
  note: z.string().optional(),
});

export const weekPlanSchema = z.object({
  weekStart: z.string(),
  days: z.record(z.string(), dayPlanSchema),
});

export function safeParseWith<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
