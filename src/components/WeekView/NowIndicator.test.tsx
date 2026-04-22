import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NowIndicator } from './NowIndicator';

describe('NowIndicator', () => {
  it('rend null quand isToday est false', () => {
    const { container } = render(<NowIndicator isToday={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('rend un élément avec role="presentation" quand isToday est true', () => {
    render(<NowIndicator isToday={true} />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('le style top est en pixels calculé à partir de l\'heure courante', () => {
    render(<NowIndicator isToday={true} />);
    const el = screen.getByRole('presentation');
    expect(el.getAttribute('style')).toMatch(/top:\s*\d+(\.\d+)?px/);
  });
});
