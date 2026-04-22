import { type JSX } from 'react';
import { HOUR_HEIGHT_PX } from '@/constants/grid';

const hours = Array.from({ length: 24 }, (_, i) => i);

export function HourRows(): JSX.Element {
  return (
    <div className="flex flex-col overflow-y-auto">
      {hours.map((h) => (
        <div
          key={h}
          style={{ height: `${HOUR_HEIGHT_PX}px` }}
          className="border-b border-[var(--md-outline-variant)] flex items-start"
        >
          <span className="text-xs text-[var(--md-on-surface-variant)] px-1">
            {`${String(h).padStart(2, '0')}:00`}
          </span>
        </div>
      ))}
    </div>
  );
}
