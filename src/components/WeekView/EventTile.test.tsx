import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventTile } from './EventTile';
import type { CalendarEvent } from '@/types';

const baseEvent: CalendarEvent = {
  id: 'e1',
  source: 'gcal',
  calendarId: 'cal1',
  title: 'Réunion équipe',
  start: '2024-01-01T09:00:00.000Z',
  end: '2024-01-01T10:00:00.000Z',
};

describe('EventTile', () => {
  it('rend un élément avec data-testid="event-tile"', () => {
    render(
      <EventTile event={baseEvent} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    expect(screen.getByTestId('event-tile')).toBeInTheDocument();
  });

  it('affiche le titre de l\'event', () => {
    render(
      <EventTile event={baseEvent} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    expect(screen.getByText('Réunion équipe')).toBeInTheDocument();
  });

  it('utilise var(--md-primary) comme accent par défaut quand event.color est absent', () => {
    render(
      <EventTile event={baseEvent} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    const tile = screen.getByTestId('event-tile');
    expect(tile.getAttribute('style')).toContain('--event-accent');
    expect(tile.getAttribute('style')).toContain('var(--md-primary)');
  });

  it('utilise event.color comme accent quand défini', () => {
    const eventWithColor: CalendarEvent = { ...baseEvent, color: '#ff5733' };
    render(
      <EventTile event={eventWithColor} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    const tile = screen.getByTestId('event-tile');
    expect(tile.getAttribute('style')).toContain('#ff5733');
  });

  it('a un bord gauche via classe border-l', () => {
    render(
      <EventTile event={baseEvent} top={0} height={64} leftPercent={0} widthPercent={100} />,
    );
    const tile = screen.getByTestId('event-tile');
    expect(tile.className).toContain('border-l');
  });
});
