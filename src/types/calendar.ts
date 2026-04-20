import { z } from 'zod';
import { calendarEventSchema } from '@/lib/schemas';

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
