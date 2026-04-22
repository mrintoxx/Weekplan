import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/store/persistence', () => ({
  getWeekPlan: vi.fn().mockResolvedValue(undefined),
  saveWeekPlan: vi.fn().mockResolvedValue(undefined),
  getAllTemplates: vi.fn().mockResolvedValue([]),
  saveTemplate: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}));

import { App } from './App';

describe('App', () => {
  it('se rend sans erreur', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('contient la barre de navigation semaine', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: /navigation semaine/i })).toBeInTheDocument();
  });

  it('contient la grille semaine avec role="grid"', () => {
    render(<App />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
