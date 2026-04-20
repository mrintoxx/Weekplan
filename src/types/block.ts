import { z } from 'zod';
import {
  blockCategorySchema,
  blockInstanceSchema,
  blockTemplateSchema,
  dayTypeSchema,
} from '@/lib/schemas';

export type BlockCategory = z.infer<typeof blockCategorySchema>;
export type DayType = z.infer<typeof dayTypeSchema>;
export type BlockTemplate = z.infer<typeof blockTemplateSchema>;
export type BlockInstance = z.infer<typeof blockInstanceSchema>;
