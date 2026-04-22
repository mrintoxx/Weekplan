import { WeekGrid, WeekNavBar, DayStrip } from '@/components/WeekView';

export function App() {
  return (
    <div className="flex flex-col h-screen bg-[var(--md-surface)] text-[var(--md-on-surface)] overflow-hidden">
      <WeekNavBar />
      <DayStrip />
      <div className="flex-1 overflow-hidden">
        <WeekGrid />
      </div>
    </div>
  );
}
