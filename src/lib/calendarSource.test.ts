import type { CalendarEvent } from '@/types';
import type { CalendarSource, MockCalendarSource } from './calendarSource';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retourne la différence en minutes entre deux strings ISO datetime. */
function diffMinutes(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60_000;
}

/** Retourne YYYY-MM-DD d'une string ISO datetime. */
function isoDate(iso: string): string {
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Contrat d'interface
// ---------------------------------------------------------------------------

describe('CalendarSource interface contract', () => {
  it('MockCalendarSource satisfies the CalendarSource interface at compile-time', () => {
    // Ce test est un test de contrat TypeScript.
    // Si CalendarSource ou MockCalendarSource n'est pas exporté, le fichier
    // ne compilera pas et le test échouera dès la phase de collecte.
    // La simple écriture de cette assignation garantit la conformité.
    const _typeCheck: CalendarSource = {} as MockCalendarSource;
    expect(_typeCheck).toBeDefined(); // assertion triviale pour valider l'exécution
  });
});

// ---------------------------------------------------------------------------
// MockCalendarSource — plage 14 jours
// ---------------------------------------------------------------------------

describe('MockCalendarSource', () => {
  let source: MockCalendarSource;
  const TODAY = '2026-04-20';
  // 7 jours avant et 6 jours après = 14 jours
  const FROM = '2026-04-13';
  const TO = '2026-04-26';

  beforeEach(async () => {
    const { MockCalendarSource: MCS } = await import('./calendarSource');
    source = new MCS();
  });

  // -------------------------------------------------------------------------
  // Cas nominal — plage 14 jours
  // -------------------------------------------------------------------------

  describe('fetchEvents(from, to) — plage 14 jours autour de today', () => {
    it('retourne une Promise résolue avec un tableau non vide', async () => {
      const events = await source.fetchEvents(FROM, TO);

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('retourne des events dont source === "gcal"', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (const event of events) {
        expect(event.source).toBe('gcal');
      }
    });

    it('retourne des events dont calendarId === "mock-work"', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (const event of events) {
        expect(event.calendarId).toBe('mock-work');
      }
    });

    it('chaque event possède les champs requis par CalendarEvent (id, title, start, end)', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (const event of events) {
        expect(typeof event.id).toBe('string');
        expect(event.id.length).toBeGreaterThan(0);
        expect(typeof event.title).toBe('string');
        expect(event.title.length).toBeGreaterThan(0);
        expect(typeof event.start).toBe('string');
        expect(typeof event.end).toBe('string');
      }
    });

    it('les events sont des CalendarEvent valides (conforme au type)', async () => {
      const events: CalendarEvent[] = await source.fetchEvents(FROM, TO);
      // Si l'affectation compile et s'exécute, le type est respecté.
      expect(events).toBeDefined();
    });

    it('les events sont triés par start chronologiquement', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1];
        const curr = events[i];
        expect(new Date(prev!.start).getTime()).toBeLessThanOrEqual(
          new Date(curr!.start).getTime()
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // Alternance Shift Jour / Shift Nuit
  // -------------------------------------------------------------------------

  describe('alternance Shift Jour / Shift Nuit', () => {
    it('les titres alternent entre "Shift Jour" et "Shift Nuit" sans doublons consécutifs', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        expect(events[i]!.title).not.toBe(events[i - 1]!.title);
      }
    });

    it('le premier shift de la plage est un Shift Jour (commence à 07:00)', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const first = events[0];

      expect(first).toBeDefined();
      expect(first!.title).toBe('Shift Jour');
    });

    it('un Shift Jour commence à 07:00 et se termine à 19:00 le même jour (durée 720 min)', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftJours = events.filter(e => e.title === 'Shift Jour');

      expect(shiftJours.length).toBeGreaterThan(0);

      for (const shift of shiftJours) {
        expect(diffMinutes(shift.start, shift.end)).toBe(720);
        expect(isoDate(shift.start)).toBe(isoDate(shift.end));
      }
    });

    it('un Shift Nuit commence à 19:00 et se termine à 07:00 le lendemain (durée 720 min)', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftNuits = events.filter(e => e.title === 'Shift Nuit');

      expect(shiftNuits.length).toBeGreaterThan(0);

      for (const shift of shiftNuits) {
        expect(diffMinutes(shift.start, shift.end)).toBe(720);
      }
    });

    it('les Shifts Nuit ont end sur J+1 par rapport à start', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftNuits = events.filter(e => e.title === 'Shift Nuit');

      expect(shiftNuits.length).toBeGreaterThan(0);

      for (const shift of shiftNuits) {
        const startDate = new Date(shift.start);
        const endDate = new Date(shift.end);

        // end doit être sur le lendemain (J+1) par rapport à start
        const startDay = startDate.toISOString().slice(0, 10);
        const endDay = endDate.toISOString().slice(0, 10);

        const startMs = new Date(startDay).getTime();
        const endMs = new Date(endDay).getTime();

        expect(endMs - startMs).toBe(24 * 60 * 60 * 1000); // exactement 1 jour d'écart
      }
    });
  });

  // -------------------------------------------------------------------------
  // Absence de gap entre shifts consécutifs
  // -------------------------------------------------------------------------

  describe('absence de gap entre shifts consécutifs', () => {
    it("le end d'un shift est exactement egal au start du shift suivant (aucun gap)", async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1]!;
        const curr = events[i]!;
        const gapMinutes = diffMinutes(prev.end, curr.start);

        expect(gapMinutes).toBe(0);
      }
    });

    it('aucun gap >= 2 heures entre deux shifts consécutifs', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1]!;
        const curr = events[i]!;
        const gapMinutes = diffMinutes(prev.end, curr.start);

        expect(gapMinutes).toBeLessThan(120);
      }
    });

    it('le Shift Nuit commence exactement quand le Shift Jour précédent se termine (19:00)', async () => {
      const events = await source.fetchEvents(FROM, TO);

      // Trouver les paires Jour → Nuit
      for (let i = 0; i < events.length - 1; i++) {
        const curr = events[i]!;
        const next = events[i + 1]!;

        if (curr.title === 'Shift Jour' && next.title === 'Shift Nuit') {
          expect(curr.end).toBe(next.start);
        }
      }
    });

    it('le Shift Jour commence exactement quand le Shift Nuit précédent se termine (07:00 J+1)', async () => {
      const events = await source.fetchEvents(FROM, TO);

      // Trouver les paires Nuit → Jour
      for (let i = 0; i < events.length - 1; i++) {
        const curr = events[i]!;
        const next = events[i + 1]!;

        if (curr.title === 'Shift Nuit' && next.title === 'Shift Jour') {
          expect(curr.end).toBe(next.start);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // IDs uniques
  // -------------------------------------------------------------------------

  describe('unicité des IDs', () => {
    it('chaque event a un id unique dans la plage retournée', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const ids = events.map(e => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -------------------------------------------------------------------------
  // Cas limite — plage vide
  // -------------------------------------------------------------------------

  describe('fetchEvents avec plage vide (from === to)', () => {
    it('retourne un tableau vide quand from === to', async () => {
      const events = await source.fetchEvents(TODAY, TODAY);

      expect(events).toEqual([]);
    });

    it('retourne un tableau vide quand from > to', async () => {
      const events = await source.fetchEvents('2026-04-20', '2026-04-19');

      expect(events).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Cas limite — plage d'un seul jour
  // -------------------------------------------------------------------------

  describe("fetchEvents avec plage d'un jour (from + 1 === to)", () => {
    it("retourne des events pour une plage d'un seul jour", async () => {
      const events = await source.fetchEvents('2026-04-20', '2026-04-21');

      expect(events.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Compatibilité avec l'interface CalendarSource
  // -------------------------------------------------------------------------

  describe('conformité avec CalendarSource', () => {
    it('fetchEvents retourne bien une Promise (thenable)', () => {
      const result = source.fetchEvents(FROM, TO);

      expect(typeof result.then).toBe('function');
    });

    it('la signature fetchEvents(from: string, to: string) est respectée', async () => {
      // TypeScript garantit ceci à la compilation.
      // On s'assure que l'appel ne lève pas d'exception à runtime.
      await expect(source.fetchEvents(FROM, TO)).resolves.toBeDefined();
    });
  });
});
