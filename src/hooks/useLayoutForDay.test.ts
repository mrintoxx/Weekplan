import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLayoutForDay } from '@/hooks/useLayoutForDay';
import type { BlockInstance, CalendarEvent } from '@/types';

function makeInstance(
  id: string,
  dateStr: string,
  startISO: string,
  endISO: string,
): BlockInstance {
  return {
    id,
    date: dateStr,
    start: startISO,
    end: endISO,
    label: `Bloc ${id}`,
    category: 'perso',
    fixed: false,
  };
}

function makeEvent(id: string, startISO: string, endISO: string): CalendarEvent {
  return {
    id,
    source: 'gcal',
    calendarId: 'cal1',
    title: `Event ${id}`,
    start: startISO,
    end: endISO,
  };
}

describe('useLayoutForDay', () => {
  it('retourne une map vide quand il n\'y a aucun bloc ni event', () => {
    const { result } = renderHook(() => useLayoutForDay([], [], '2024-01-01'));

    expect(result.current).toEqual({});
  });

  it('retourne une entrée avec segment=single pour un bloc simple (même jour)', () => {
    const instance = makeInstance(
      'b1',
      '2024-01-01',
      '2024-01-01T12:00:00.000Z',
      '2024-01-01T13:00:00.000Z',
    );

    const { result } = renderHook(() => useLayoutForDay([instance], [], '2024-01-01'));

    const entry = result.current['b1#single'];
    expect(entry).toBeDefined();
    expect(entry?.segment).toBe('single');
    // Durée = 60 min → height = 60 * 64 / 60 = 64
    expect(entry?.height).toBeCloseTo(64, 0);
    // Seul bloc → pas de chevauchement
    expect(entry?.leftPercent).toBe(0);
    expect(entry?.widthPercent).toBe(100);
    // top >= 0 et dans la grille (< 24 * 64 = 1536)
    expect(entry?.top).toBeGreaterThanOrEqual(0);
    expect(entry?.top).toBeLessThan(24 * 64);
  });

  it('pour un bloc traversant minuit, retourne uniquement le segment #start pour le jour de départ', () => {
    // Bloc de 22:00 UTC à 06:00 UTC le lendemain
    const instance = makeInstance(
      'b2',
      '2024-01-01',
      '2024-01-01T22:00:00.000Z',
      '2024-01-02T06:00:00.000Z',
    );

    const { result } = renderHook(() => useLayoutForDay([instance], [], '2024-01-01'));

    expect(result.current['b2#start']).toBeDefined();
    expect(result.current['b2#start']?.segment).toBe('start');
    expect(result.current['b2#end']).toBeUndefined();

    // height > 0 et < grille complète (durée partielle avant minuit local)
    const h = result.current['b2#start']?.height ?? 0;
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThan(24 * 64);
  });

  it('pour un bloc traversant minuit, retourne uniquement le segment #end pour le jour suivant', () => {
    const instance = makeInstance(
      'b2',
      '2024-01-01',
      '2024-01-01T22:00:00.000Z',
      '2024-01-02T06:00:00.000Z',
    );

    const { result } = renderHook(() => useLayoutForDay([instance], [], '2024-01-02'));

    expect(result.current['b2#end']).toBeDefined();
    expect(result.current['b2#end']?.segment).toBe('end');
    expect(result.current['b2#start']).toBeUndefined();
    // top doit être 0 (commence à minuit)
    expect(result.current['b2#end']?.top).toBe(0);
  });

  it('calcule leftPercent et widthPercent corrects pour 2 blocs qui se chevauchent', () => {
    // Bloc A : 09:00 à 11:00 UTC, Bloc B : 10:00 à 12:00 UTC
    const a = makeInstance('a', '2024-01-01', '2024-01-01T09:00:00.000Z', '2024-01-01T11:00:00.000Z');
    const b = makeInstance('b', '2024-01-01', '2024-01-01T10:00:00.000Z', '2024-01-01T12:00:00.000Z');

    const { result } = renderHook(() => useLayoutForDay([a, b], [], '2024-01-01'));

    const entryA = result.current['a#single'];
    const entryB = result.current['b#single'];

    expect(entryA).toBeDefined();
    expect(entryB).toBeDefined();

    // Les deux occupent chacun 50% de largeur
    expect(entryA?.widthPercent).toBeCloseTo(50, 1);
    expect(entryB?.widthPercent).toBeCloseTo(50, 1);

    // L'un est à left=0, l'autre à left=50
    const lefts = [entryA?.leftPercent ?? -1, entryB?.leftPercent ?? -1].sort((x, y) => x - y);
    expect(lefts[0]).toBeCloseTo(0, 1);
    expect(lefts[1]).toBeCloseTo(50, 1);
  });

  it('inclut un CalendarEvent dans la map avec son segment#single', () => {
    const event = makeEvent('e1', '2024-01-01T09:00:00.000Z', '2024-01-01T10:00:00.000Z');

    const { result } = renderHook(() => useLayoutForDay([], [event], '2024-01-01'));

    const entry = result.current['e1#single'];
    expect(entry).toBeDefined();
    expect(entry?.segment).toBe('single');
    expect(entry?.height).toBeCloseTo(64, 0);
  });

  it('event en colonne 1 quand il chevauche un bloc normal', () => {
    const event = makeEvent('e1', '2024-01-01T09:00:00.000Z', '2024-01-01T10:00:00.000Z');
    const bloc = makeInstance('b1', '2024-01-01', '2024-01-01T09:00:00.000Z', '2024-01-01T10:00:00.000Z');

    const { result } = renderHook(() => useLayoutForDay([bloc], [event], '2024-01-01'));

    const eventEntry = result.current['e1#single'];
    const blocEntry = result.current['b1#single'];

    expect(eventEntry?.leftPercent).toBeCloseTo(0, 1);
    expect(blocEntry?.leftPercent).toBeCloseTo(50, 1);
  });

  it('retourne un objet stable (même référence) si instances/events/date n\'ont pas changé', () => {
    const instances: BlockInstance[] = [];
    const events: CalendarEvent[] = [];

    const { result, rerender } = renderHook(
      ({ inst, evts }: { inst: BlockInstance[]; evts: CalendarEvent[] }) =>
        useLayoutForDay(inst, evts, '2024-01-01'),
      { initialProps: { inst: instances, evts: events } },
    );

    const first = result.current;
    rerender({ inst: instances, evts: events });

    expect(result.current).toBe(first);
  });
});
