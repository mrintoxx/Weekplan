import { HOUR_HEIGHT_PX } from '@/constants/grid';
import { useCurrentTime } from '@/hooks/useCurrentTime';

type NowIndicatorProps = {
  isToday: boolean;
};

export function NowIndicator({ isToday }: NowIndicatorProps) {
  const currentDate = useCurrentTime();

  if (!isToday) return null;

  const top = (currentDate.getHours() * 60 + currentDate.getMinutes()) * HOUR_HEIGHT_PX / 60;

  return (
    <div
      role="presentation"
      style={{ top: `${top}px` }}
      className="absolute left-0 right-0 h-[2px] bg-[var(--md-error)] z-10 pointer-events-none"
    />
  );
}
