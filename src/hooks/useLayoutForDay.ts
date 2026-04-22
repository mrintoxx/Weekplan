import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { BlockInstance, CalendarEvent } from '@/types';
import { splitInstanceForDay, splitAtMidnight } from '@/lib/datetime';
import { computeLayout } from '@/lib/layout';
import type { LayoutItem } from '@/lib/layout';
import { HOUR_HEIGHT_PX } from '@/constants/grid';

export type SegmentLayout = {
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  segment: 'start' | 'end' | 'single';
};

export type LayoutMap = Record<string, SegmentLayout>;

type InternalItem = LayoutItem & {
  segment: 'start' | 'end' | 'single';
};

export function useLayoutForDay(
  instances: BlockInstance[],
  events: CalendarEvent[],
  date: string,
): LayoutMap {
  return useMemo(() => {
    const items: InternalItem[] = [];

    for (const instance of instances) {
      const segments = splitInstanceForDay(instance, date);
      for (const seg of segments) {
        items.push({ id: seg.id, start: seg.start, end: seg.end, segment: seg.segment });
      }
    }

    for (const event of events) {
      const segments = splitAtMidnight(event.start, event.end);
      for (const seg of segments) {
        if (dayjs(seg.start).format('YYYY-MM-DD') !== date) continue;
        const id = `${event.id}#${seg.segment}`;
        items.push({ id, start: seg.start, end: seg.end, isEvent: true, segment: seg.segment });
      }
    }

    if (items.length === 0) return {};

    const layoutResults = computeLayout(
      items.map(({ id, start, end, isEvent }) => ({
        id,
        start,
        end,
        ...(isEvent !== undefined ? { isEvent } : {}),
      })),
    );
    const resultMap = new Map(layoutResults.map((r) => [r.id, r]));

    const map: LayoutMap = {};
    for (const item of items) {
      const lr = resultMap.get(item.id);
      if (!lr) continue;

      const segStart = dayjs(item.start);
      const segEnd = dayjs(item.end);
      const startMinutes = segStart.hour() * 60 + segStart.minute();
      const durationMinutes = (segEnd.valueOf() - segStart.valueOf()) / 60_000;

      map[item.id] = {
        top: (startMinutes * HOUR_HEIGHT_PX) / 60,
        height: (durationMinutes * HOUR_HEIGHT_PX) / 60,
        leftPercent: ((lr.column - 1) * 100) / lr.totalColumns,
        widthPercent: 100 / lr.totalColumns,
        segment: item.segment,
      };
    }

    return map;
  }, [instances, events, date]);
}
