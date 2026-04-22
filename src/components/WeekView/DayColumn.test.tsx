import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayColumn } from './DayColumn';
import type { BlockInstance, CalendarEvent } from '@/types';

const instances: BlockInstance[] = [
  {
    id: 'b1',
    date: '2024-01-01',
    start: '2024-01-01T08:00:00.000Z',
    end: '2024-01-01T09:00:00.000Z',
    label: 'Sport',
    category: 'sport',
    fixed: false,
  },
  {
    id: 'b2',
    date: '2024-01-01',
    start: '2024-01-01T10:00:00.000Z',
    end: '2024-01-01T11:00:00.000Z',
    label: 'Repos',
    category: 'repos',
    fixed: false,
  },
];

const events: CalendarEvent[] = [
  {
    id: 'e1',
    source: 'gcal',
    calendarId: 'cal1',
    title: 'Réunion',
    start: '2024-01-01T14:00:00.000Z',
    end: '2024-01-01T15:00:00.000Z',
  },
];

describe('DayColumn', () => {
  it('a role="gridcell"', () => {
    render(<DayColumn date="2024-01-01" instances={[]} events={[]} isToday={false} />);
    expect(screen.getByRole('gridcell')).toBeInTheDocument();
  });

  it('a data-testid="day-column-{date}"', () => {
    render(<DayColumn date="2024-01-01" instances={[]} events={[]} isToday={false} />);
    expect(screen.getByTestId('day-column-2024-01-01')).toBeInTheDocument();
  });

  it('rend 2 BlockTile pour 2 instances', () => {
    render(<DayColumn date="2024-01-01" instances={instances} events={[]} isToday={false} />);
    expect(screen.getAllByTestId('block-tile')).toHaveLength(2);
  });

  it('rend 1 EventTile pour 1 event', () => {
    render(<DayColumn date="2024-01-01" instances={[]} events={events} isToday={false} />);
    expect(screen.getAllByTestId('event-tile')).toHaveLength(1);
  });

  it('rend 2 BlockTile et 1 EventTile ensemble', () => {
    render(
      <DayColumn date="2024-01-01" instances={instances} events={events} isToday={false} />,
    );
    expect(screen.getAllByTestId('block-tile')).toHaveLength(2);
    expect(screen.getAllByTestId('event-tile')).toHaveLength(1);
  });

  it('rend NowIndicator quand isToday=true', () => {
    render(<DayColumn date="2024-01-01" instances={[]} events={[]} isToday={true} />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('n\'affiche pas NowIndicator quand isToday=false', () => {
    render(<DayColumn date="2024-01-01" instances={[]} events={[]} isToday={false} />);
    expect(screen.queryByRole('presentation')).toBeNull();
  });
});
