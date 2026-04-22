import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HourRows } from './HourRows';

describe('HourRows', () => {
  it('rend 24 labels horaires de 00:00 à 23:00', () => {
    render(<HourRows />);
    expect(screen.getAllByText(/\d{2}:00/).length).toBe(24);
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
  });
});
