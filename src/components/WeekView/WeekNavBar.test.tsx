import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/store/persistence', () => ({
  getWeekPlan: vi.fn().mockResolvedValue(undefined),
  saveWeekPlan: vi.fn().mockResolvedValue(undefined),
  getAllTemplates: vi.fn().mockResolvedValue([]),
  saveTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { useStore } from '@/store/useStore';
import { WeekNavBar } from './WeekNavBar';

const INITIAL_WEEK = '2024-01-01';

beforeEach(() => {
  useStore.setState({
    selectedWeekStart: INITIAL_WEEK,
    selectedDate: INITIAL_WEEK,
  });
});

describe('WeekNavBar', () => {
  it('rend les 3 boutons de navigation', () => {
    render(<WeekNavBar />);
    expect(screen.getByRole('button', { name: /précédente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suivante/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aujourd'hui/i })).toBeInTheDocument();
  });

  it('clic "Semaine suivante" avance selectedWeekStart de 7 jours', async () => {
    const user = userEvent.setup();
    render(<WeekNavBar />);

    await user.click(screen.getByRole('button', { name: /suivante/i }));

    expect(useStore.getState().selectedWeekStart).toBe('2024-01-08');
  });

  it('clic "Semaine précédente" recule selectedWeekStart de 7 jours', async () => {
    const user = userEvent.setup();
    render(<WeekNavBar />);

    await user.click(screen.getByRole('button', { name: /précédente/i }));

    expect(useStore.getState().selectedWeekStart).toBe('2023-12-25');
  });

  it('clic "Aujourd\'hui" remet selectedWeekStart au lundi de la semaine courante', async () => {
    const user = userEvent.setup();
    useStore.setState({ selectedWeekStart: '2020-01-01' });
    render(<WeekNavBar />);

    await user.click(screen.getByRole('button', { name: /aujourd'hui/i }));

    // selectedWeekStart doit être un lundi (ISO : day 1)
    const { selectedWeekStart } = useStore.getState();
    expect(new Date(selectedWeekStart).getDay()).toBe(1);
  });
});
