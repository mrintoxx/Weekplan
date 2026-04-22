import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { weekStartOf, formatISODate } from '@/lib/datetime';

export function WeekNavBar() {
  const selectedWeekStart = useStore((s) => s.selectedWeekStart);
  const setSelectedWeekStart = useStore((s) => s.setSelectedWeekStart);
  const setSelectedDate = useStore((s) => s.setSelectedDate);

  const weekStart = dayjs(selectedWeekStart);
  const weekEnd = weekStart.add(6, 'day');

  const startLabel = weekStart.locale('fr').format('D');
  const endLabel = weekEnd.locale('fr').format('D MMMM YYYY');
  const weekLabel = `${startLabel} – ${endLabel}`;

  const goToPrev = () => {
    const prev = weekStart.subtract(7, 'day');
    const prevStr = formatISODate(prev);
    setSelectedWeekStart(prevStr);
    setSelectedDate(prevStr);
  };

  const goToNext = () => {
    const next = weekStart.add(7, 'day');
    const nextStr = formatISODate(next);
    setSelectedWeekStart(nextStr);
    setSelectedDate(nextStr);
  };

  const goToToday = () => {
    const today = dayjs();
    const todayWeekStart = formatISODate(weekStartOf(today));
    const todayStr = formatISODate(today);
    setSelectedWeekStart(todayWeekStart);
    setSelectedDate(todayStr);
  };

  return (
    <nav
      aria-label="Navigation semaine"
      className="flex items-center gap-2 px-4 py-2 border-b border-[var(--md-outline-variant)]"
    >
      <button
        type="button"
        aria-label="Semaine précédente"
        onClick={goToPrev}
        className="p-1 rounded-[var(--md-shape-sm)] hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="flex-1 text-center text-sm font-medium text-[var(--md-on-surface)]">
        {weekLabel}
      </span>

      <button
        type="button"
        aria-label="Semaine suivante"
        onClick={goToNext}
        className="p-1 rounded-[var(--md-shape-sm)] hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)]"
      >
        <ChevronRight size={20} />
      </button>

      <button
        type="button"
        onClick={goToToday}
        className="ml-2 px-3 py-1 text-xs font-medium rounded-[var(--md-shape-full)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]"
      >
        Aujourd'hui
      </button>
    </nav>
  );
}
