import { Dumbbell, Hammer, Baby, Moon, User, Briefcase, ArrowRight, Server, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/constants/categories';
import type { BlockInstance } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell,
  Hammer,
  Baby,
  Moon,
  User,
  Briefcase,
  ArrowRight,
  Server,
  Heart,
};

type BlockTileProps = {
  instance: BlockInstance;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  segment?: 'start' | 'end' | 'single';
};

export function BlockTile({ instance, top, height, leftPercent, widthPercent, segment }: BlockTileProps) {
  const config = CATEGORY_CONFIG[instance.category];
  const Icon = ICON_MAP[config.icon] ?? Briefcase;

  const roundingClass =
    segment === 'start'
      ? 'rounded-t-[var(--md-shape-md)] rounded-b-none'
      : segment === 'end'
        ? 'rounded-b-[var(--md-shape-md)] rounded-t-none'
        : 'rounded-[var(--md-shape-md)]';

  return (
    <div
      data-testid="block-tile"
      className={`absolute overflow-hidden flex items-start gap-1 p-1 ${roundingClass}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: `var(${config.colorToken})`,
      }}
    >
      <Icon size={12} className="shrink-0 mt-px" />
      <span data-label className={height < 30 ? 'hidden' : 'truncate text-xs leading-tight'}>
        {instance.label}
      </span>
    </div>
  );
}
