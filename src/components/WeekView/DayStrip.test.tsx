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
import { DayStrip } from './DayStrip';

const WEEK_START = '2024-01-01';

beforeEach(() => {
  useStore.setState({
    selectedWeekStart: WEEK_START,
    selectedDate: WEEK_START,
  });
});

describe('DayStrip', () => {
  it('rend 7 pastilles (role=tab)', () => {
    render(<DayStrip />);
    expect(screen.getAllByRole('tab')).toHaveLength(7);
  });

  it('la pastille du jour sélectionné a aria-selected=true', () => {
    render(<DayStrip />);
    const selected = screen.getAllByRole('tab').filter(
      (el) => el.getAttribute('aria-selected') === 'true',
    );
    expect(selected).toHaveLength(1);
  });

  it('clic sur une pastille appelle setSelectedDate', async () => {
    const user = userEvent.setup();
    render(<DayStrip />);

    const tabs = screen.getAllByRole('tab');
    const secondTab = tabs[1];
    expect(secondTab).toBeDefined();
    await user.click(secondTab!);

    expect(useStore.getState().selectedDate).toBe('2024-01-02');
  });

  it('a un role="tablist" sur le conteneur', () => {
    render(<DayStrip />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
