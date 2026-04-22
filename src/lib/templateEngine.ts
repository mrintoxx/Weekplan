import type { DayTemplate, BlockInstance, CalendarEvent } from '@/types';
import { logger } from '@/lib/logger';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function overlaps(bs: string, be: string, es: string, ee: string): boolean {
  return new Date(bs).getTime() < new Date(ee).getTime()
    && new Date(es).getTime() < new Date(be).getTime();
}

function durationMinutes(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
}

export function instantiateTemplate(
  template: DayTemplate,
  date: string,
  events: CalendarEvent[],
  idGenerator: () => string = () => crypto.randomUUID(),
): BlockInstance[] {
  if (!dayjs(date).isValid()) {
    logger.warn('instantiateTemplate: invalid date, skipping', { templateId: template.id, date });
    return [];
  }

  const instances: BlockInstance[] = [];

  for (const block of template.blocks) {
    const startDayjs = dayjs.tz(`${date}T${block.start}`, 'Europe/Paris');
    const blockStart = startDayjs.format();
    const blockEnd = startDayjs.add(block.duration, 'minute').format();

    const conflictingEvents = events
      .filter((ev) => overlaps(blockStart, blockEnd, ev.start, ev.end))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const hasConflict = conflictingEvents.length > 0;

    if (!hasConflict || block.allowOverlap === true) {
      instances.push(buildInstance(idGenerator, date, block.id, block.label, block.category, block.fixed ?? false, blockStart, blockEnd, block.notes));
      continue;
    }

    if (block.fixed === true) {
      logger.warn('Fixed block not placed due to gcal conflict', { blockId: block.id, date });
      continue;
    }

    const truncatedEnd = conflictingEvents[0]?.start;
    if (truncatedEnd === undefined) continue;
    const remaining = durationMinutes(blockStart, truncatedEnd);

    if (remaining < 15) {
      continue;
    }

    instances.push(buildInstance(idGenerator, date, block.id, block.label, block.category, block.fixed ?? false, blockStart, truncatedEnd, block.notes));
  }

  return instances;
}

import type { BlockCategory } from '@/types';

function buildInstance(
  idGenerator: () => string,
  date: string,
  sourceTemplateId: string,
  label: string,
  category: BlockCategory,
  fixed: boolean,
  start: string,
  end: string,
  notes: string | undefined,
): BlockInstance {
  const base: BlockInstance = {
    id: idGenerator(),
    date,
    start,
    end,
    label,
    category,
    sourceTemplateId,
    fixed,
  };
  if (notes !== undefined) {
    return { ...base, notes };
  }
  return base;
}
