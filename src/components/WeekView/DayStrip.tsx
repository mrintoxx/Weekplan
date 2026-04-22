import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useStore } from '@/store/useStore';

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function DayStrip() {
  const selectedWeekStart = useStore((s) => s.selectedWeekStart);
  const selectedDate = useStore((s) => s.selectedDate);
  const setSelectedDate = useStore((s) => s.setSelectedDate);

  const days = Array.from({ length: 7 }, (_, i) =>
    dayjs(selectedWeekStart).add(i, 'day'),
  );
  const todayStr = dayjs().format('YYYY-MM-DD');

  return (
    <div
      role="tablist"
      aria-label="Jours de la semaine"
      className="flex sm:hidden overflow-x-auto gap-1 px-2 py-1 border-b border-[var(--md-outline-variant)]"
    >
      {days.map((day, i) => {
        const dateStr = day.format('YYYY-MM-DD');
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === todayStr;
        const dayLetter = DAYS_SHORT[i] ?? day.format('dd')[0];

        return (
          <button
            key={dateStr}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={day.locale('fr').format('dddd D MMMM')}
            onClick={() => setSelectedDate(dateStr)}
            className={`flex flex-col items-center min-w-[36px] py-1 rounded-[var(--md-shape-full)] text-xs transition-colors ${
              isSelected
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                : 'text-[var(--md-on-surface-variant)]'
            }`}
          >
            <span className="font-medium">{dayLetter}</span>
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                isToday && !isSelected
                  ? 'border border-[var(--md-primary)] text-[var(--md-primary)]'
                  : ''
              }`}
            >
              {day.format('D')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
