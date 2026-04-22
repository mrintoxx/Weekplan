import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BlockInstance } from '@/types';

// Mock IndexedDB persistence before importing anything store-related
vi.mock('@/store/persistence', () => ({
  getWeekPlan: vi.fn().mockResolvedValue(undefined),
  saveWeekPlan: vi.fn().mockResolvedValue(undefined),
  getAllTemplates: vi.fn().mockResolvedValue([]),
  saveTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { useStore } from '@/store/useStore';
import { WeekGrid } from './WeekGrid';

const WEEK_START = '2024-01-01'; // lundi

const makeInstance = (id: string, date: string): BlockInstance => ({
  id,
  date,
  start: `${date}T09:00:00.000Z`,
  end: `${date}T10:00:00.000Z`,
  label: `Bloc ${id}`,
  category: 'perso',
  fixed: false,
});

beforeEach(() => {
  useStore.setState({
    selectedWeekStart: WEEK_START,
    selectedDate: WEEK_START,
    weekPlans: {
      [WEEK_START]: {
        weekStart: WEEK_START,
        days: {
          '2024-01-01': {
            date: '2024-01-01',
            instances: [makeInstance('b1', '2024-01-01'), makeInstance('b2', '2024-01-01')],
          },
          '2024-01-03': {
            date: '2024-01-03',
            instances: [makeInstance('b3', '2024-01-03')],
          },
        },
      },
    },
    eventsByWeek: {},
  });
});

describe('WeekGrid', () => {
  it('rend 7 cellules day-column', () => {
    render(<WeekGrid />);
    const columns = screen.getAllByRole('gridcell');
    expect(columns).toHaveLength(7);
  });

  it('rend les 7 headers de colonnes jour', () => {
    render(<WeekGrid />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(7);
  });

  it('les blocs du lundi (2024-01-01) apparaissent', () => {
    render(<WeekGrid />);
    const tiles = screen.getAllByTestId('block-tile');
    // Au moins les 2 blocs du lundi doivent être présents
    expect(tiles.length).toBeGreaterThanOrEqual(2);
  });

  it('a un élément role="grid" sur le corps de la grille', () => {
    render(<WeekGrid />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('affiche les labels de jours abrégés', () => {
    render(<WeekGrid />);
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Dim')).toBeInTheDocument();
  });
});
