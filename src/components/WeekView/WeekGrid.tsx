import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/store/useStore';
import { HOUR_HEIGHT_PX } from '@/constants/grid';
import { HourRows } from './HourRows';
import { DayColumn } from './DayColumn';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysOfWeek(weekStart: string): dayjs.Dayjs[] {
  const start = dayjs(weekStart);
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

export function WeekGrid() {
  const selectedWeekStart = useStore((s) => s.selectedWeekStart);
  const selectedDate = useStore((s) => s.selectedDate);
  const weekPlans = useStore((s) => s.weekPlans);
  const eventsByWeek = useStore(useShallow((s) => s.eventsByWeek));

  const weekPlan = weekPlans[selectedWeekStart];
  const days = getDaysOfWeek(selectedWeekStart);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const gridHeight = 24 * HOUR_HEIGHT_PX;

  const allEvents = useMemo(() => Object.values(eventsByWeek).flat(), [eventsByWeek]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header jours */}
      <div className="flex" role="row">
        {/* Espace au-dessus de la colonne horaire */}
        <div className="w-14 shrink-0" aria-hidden="true" />
        {days.map((day, i) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isSelected = dateStr === selectedDate;
          const dayLabel = DAYS_FR[i] ?? day.format('ddd');
          const dayNum = day.format('D');
          return (
            <div
              key={dateStr}
              role="columnheader"
              aria-label={`${dayLabel} ${dayNum}`}
              className={`flex-1 text-center py-1 text-xs font-medium text-[var(--md-on-surface-variant)] border-b border-[var(--md-outline-variant)] ${
                isSelected ? 'text-[var(--md-primary)]' : ''
              }`}
            >
              <span>{dayLabel}</span>{' '}
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                  dateStr === todayStr
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                    : ''
                }`}
              >
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>

      {/* Corps de la grille */}
      <div className="flex flex-1 overflow-y-auto" role="grid" aria-label="Grille semaine">
        {/* Colonne horaire sticky */}
        <div
          className="w-14 shrink-0 sticky left-0 bg-[var(--md-surface)] z-10"
          aria-hidden="true"
        >
          <HourRows />
        </div>

        {/* 7 colonnes jours */}
        {days.map((day) => {
          const dateStr = day.format('YYYY-MM-DD');
          const dayPlan = weekPlan?.days[dateStr];
          const instances = dayPlan?.instances ?? [];
          const d = dayjs(dateStr);
          const dayStart = d.startOf('day').valueOf();
          const dayEnd = d.endOf('day').valueOf();
          const events = allEvents.filter((ev) => {
            const evStart = new Date(ev.start).getTime();
            const evEnd = new Date(ev.end).getTime();
            return evStart < dayEnd && evEnd > dayStart;
          });
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`flex-1 ${
                dateStr !== selectedDate ? 'hidden sm:block' : 'block'
              }`}
              style={{ height: `${gridHeight}px` }}
            >
              <DayColumn
                date={dateStr}
                instances={instances}
                events={events}
                isToday={isToday}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
