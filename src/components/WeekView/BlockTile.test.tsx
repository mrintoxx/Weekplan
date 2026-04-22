import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockTile } from './BlockTile';
import type { BlockInstance } from '@/types';

const baseInstance: BlockInstance = {
  id: 'b1',
  date: '2024-01-01',
  start: '2024-01-01T08:00:00.000Z',
  end: '2024-01-01T09:00:00.000Z',
  label: 'Sport matinal',
  category: 'sport',
  fixed: false,
};

describe('BlockTile', () => {
  it('rend un élément avec data-testid="block-tile"', () => {
    render(
      <BlockTile instance={baseInstance} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    expect(screen.getByTestId('block-tile')).toBeInTheDocument();
  });

  it('affiche le label quand height >= 30', () => {
    render(
      <BlockTile instance={baseInstance} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    expect(screen.getByText('Sport matinal')).toBeInTheDocument();
  });

  it('masque le label quand height < 30', () => {
    render(
      <BlockTile instance={baseInstance} top={0} height={20} leftPercent={0} widthPercent={100} />,
    );
    const label = screen.getByTestId('block-tile').querySelector('[data-label]');
    expect(label?.classList.contains('hidden')).toBe(true);
  });

  it('applique rounded-t pour segment="start"', () => {
    render(
      <BlockTile
        instance={baseInstance}
        top={0}
        height={64}
        leftPercent={0}
        widthPercent={100}
        segment="start"
      />,
    );
    const tile = screen.getByTestId('block-tile');
    expect(tile.className).toContain('rounded-t');
  });

  it('applique rounded-b pour segment="end"', () => {
    render(
      <BlockTile
        instance={baseInstance}
        top={0}
        height={64}
        leftPercent={0}
        widthPercent={100}
        segment="end"
      />,
    );
    const tile = screen.getByTestId('block-tile');
    expect(tile.className).toContain('rounded-b');
  });

  it('applique rounded pour segment="single" ou absent', () => {
    render(
      <BlockTile
        instance={baseInstance}
        top={0}
        height={64}
        leftPercent={0}
        widthPercent={100}
        segment="single"
      />,
    );
    const tile = screen.getByTestId('block-tile');
    expect(tile.className).toMatch(/rounded-\[/);
  });
});
