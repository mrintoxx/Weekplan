import type { CSSProperties } from 'react';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types';

type EventTileProps = {
  event: CalendarEvent;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
};

export function EventTile({ event, top, height, leftPercent, widthPercent }: EventTileProps) {
  const startStr = dayjs(event.start).format('HH:mm');
  const endStr = dayjs(event.end).format('HH:mm');

  return (
    <div
      data-testid="event-tile"
      className="absolute overflow-hidden flex flex-col gap-0.5 p-1 border-l-4 border-l-[var(--event-accent)] bg-[var(--md-surface-container-high)] rounded-r-[var(--md-shape-md)]"
      style={
        {
          top: `${top}px`,
          height: `${height}px`,
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          '--event-accent': event.color ?? 'var(--md-primary)',
        } as CSSProperties
      }
    >
      <span className="truncate text-xs font-medium leading-tight text-[var(--md-on-surface)]">
        {event.title}
      </span>
      <span className="text-[10px] leading-tight text-[var(--md-on-surface-variant)]">
        {startStr} – {endStr}
      </span>
    </div>
  );
}
