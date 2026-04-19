import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the application title', () => {
    render(<App />);
    const heading = screen.getByText('Daily Block Planner');
    expect(heading).toBeInTheDocument();
  });

  it('renders heading with correct tag', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Daily Block Planner');
  });
});
