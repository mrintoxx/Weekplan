import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import type { BlockInstance, CalendarEvent } from '@/types';
import { useLayoutForDay } from '@/hooks/useLayoutForDay';
import { HOUR_HEIGHT_PX } from '@/constants/grid';
import { BlockTile } from './BlockTile';
import { EventTile } from './EventTile';
import { NowIndicator } from './NowIndicator';

type DayColumnProps = {
  date: string;
  instances: BlockInstance[];
  events: CalendarEvent[];
  isToday: boolean;
};

export function DayColumn({ date, instances, events, isToday }: DayColumnProps) {
  const layoutMap = useLayoutForDay(instances, events, date);
  const gridHeight = 24 * HOUR_HEIGHT_PX;
  const ariaLabel = `Jour ${dayjs(date).locale('fr').format('dddd D MMMM YYYY')}`;

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      data-testid={`day-column-${date}`}
      className="relative flex-1 border-l border-[var(--md-outline-variant)]"
      style={{ height: `${gridHeight}px` }}
    >
      <NowIndicator isToday={isToday} />

      {instances.map((instance) => {
        const singleKey = `${instance.id}#single`;
        const startKey = `${instance.id}#start`;
        const endKey = `${instance.id}#end`;

        const singleLayout = layoutMap[singleKey];
        if (singleLayout) {
          return (
            <BlockTile
              key={singleKey}
              instance={instance}
              top={singleLayout.top}
              height={singleLayout.height}
              leftPercent={singleLayout.leftPercent}
              widthPercent={singleLayout.widthPercent}
              segment="single"
            />
          );
        }

        const segments: ReactNode[] = [];
        const startLayout = layoutMap[startKey];
        if (startLayout) {
          segments.push(
            <BlockTile
              key={startKey}
              instance={instance}
              top={startLayout.top}
              height={startLayout.height}
              leftPercent={startLayout.leftPercent}
              widthPercent={startLayout.widthPercent}
              segment="start"
            />,
          );
        }
        const endLayout = layoutMap[endKey];
        if (endLayout) {
          segments.push(
            <BlockTile
              key={endKey}
              instance={instance}
              top={endLayout.top}
              height={endLayout.height}
              leftPercent={endLayout.leftPercent}
              widthPercent={endLayout.widthPercent}
              segment="end"
            />,
          );
        }
        return segments;
      })}

      {events.map((event) => {
        const singleKey = `${event.id}#single`;
        const startKey = `${event.id}#start`;
        const endKey = `${event.id}#end`;

        const singleLayout = layoutMap[singleKey];
        if (singleLayout) {
          return (
            <EventTile
              key={singleKey}
              event={event}
              top={singleLayout.top}
              height={singleLayout.height}
              leftPercent={singleLayout.leftPercent}
              widthPercent={singleLayout.widthPercent}
            />
          );
        }

        const startLayout = layoutMap[startKey];
        const endLayout = layoutMap[endKey];
        const visible = startLayout ?? endLayout;
        if (!visible) return null;
        const segKey = startLayout ? startKey : endKey;
        return (
          <EventTile
            key={segKey}
            event={event}
            top={visible.top}
            height={visible.height}
            leftPercent={visible.leftPercent}
            widthPercent={visible.widthPercent}
          />
        );
      })}
    </div>
  );
}
