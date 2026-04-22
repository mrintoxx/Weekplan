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
    const _typeCheck: CalendarSource = {} as MockCalendarSource;
    expect(_typeCheck).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// MockCalendarSource — plage 14 jours
//
// Cycle de 5 jours ancré au lundi de la semaine contenant `from`.
// FROM = '2026-04-13' est un lundi → ancre = '2026-04-13'.
//
// offset 0 → Apr 13, 18, 23 … : OFF       (aucun event)
// offset 1 → Apr 14, 19, 24 … : TRAVAIL   (Shift Jour)
// offset 2 → Apr 15, 20, 25 … : PRE-NIGHT (Shift Nuit)
// offset 3 → Apr 16, 21 …     : POST-NIGHT (aucun event)
// offset 4 → Apr 17, 22 …     : OFF        (aucun event)
// ---------------------------------------------------------------------------

describe('MockCalendarSource', () => {
  let source: MockCalendarSource;
  const TODAY = '2026-04-20';
  const FROM  = '2026-04-13'; // lundi = ancre du cycle
  const TO    = '2026-04-26';

  // Jours utiles pour les nouveaux tests (relatifs à l'ancre Apr 13)
  const DAY_OFF       = '2026-04-13'; // offset 0 → OFF
  const DAY_TRAVAIL   = '2026-04-14'; // offset 1 → TRAVAIL
  const DAY_NUIT      = '2026-04-15'; // offset 2 → PRE-NIGHT
  const DAY_POST_NUIT = '2026-04-16'; // offset 3 → POST-NIGHT
  const DAY_OFF2      = '2026-04-17'; // offset 4 → OFF

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
      expect(events).toBeDefined();
    });

    it('les events sont triés par start chronologiquement', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1];
        const curr = events[i];
        expect(new Date(prev!.start).getTime()).toBeLessThanOrEqual(
          new Date(curr!.start).getTime(),
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // Structure des shifts Jour / Nuit
  // -------------------------------------------------------------------------

  describe('structure des shifts Jour / Nuit', () => {
    it('les titres des events consécutifs alternent entre "Shift Jour" et "Shift Nuit"', async () => {
      const events = await source.fetchEvents(FROM, TO);

      for (let i = 1; i < events.length; i++) {
        expect(events[i]!.title).not.toBe(events[i - 1]!.title);
      }
    });

    it('le premier event de la plage est un Shift Jour', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const first = events[0];

      expect(first).toBeDefined();
      expect(first!.title).toBe('Shift Jour');
    });

    it('un Shift Jour commence à 07:00 et se termine à 19:00 le même jour (durée 720 min)', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftJours = events.filter((e) => e.title === 'Shift Jour');

      expect(shiftJours.length).toBeGreaterThan(0);

      for (const shift of shiftJours) {
        expect(diffMinutes(shift.start, shift.end)).toBe(720);
        expect(isoDate(shift.start)).toBe(isoDate(shift.end));
      }
    });

    it('un Shift Nuit commence à 19:00 et se termine à 07:00 le lendemain (durée 720 min)', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftNuits = events.filter((e) => e.title === 'Shift Nuit');

      expect(shiftNuits.length).toBeGreaterThan(0);

      for (const shift of shiftNuits) {
        expect(diffMinutes(shift.start, shift.end)).toBe(720);
      }
    });

    it('les Shifts Nuit ont end sur J+1 par rapport à start', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const shiftNuits = events.filter((e) => e.title === 'Shift Nuit');

      expect(shiftNuits.length).toBeGreaterThan(0);

      for (const shift of shiftNuits) {
        const startDay = new Date(shift.start).toISOString().slice(0, 10);
        const endDay = new Date(shift.end).toISOString().slice(0, 10);

        const startMs = new Date(startDay).getTime();
        const endMs = new Date(endDay).getTime();

        expect(endMs - startMs).toBe(24 * 60 * 60 * 1000);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Cycle réaliste de 5 jours
  // -------------------------------------------------------------------------

  describe('cycle réaliste de 5 jours', () => {
    it('cycle 5 jours : off / travail / pré-nuit / post-nuit / off', async () => {
      // Ancre = Apr 13 (lundi). Chaque appel mono-journée ancre au lundi de sa semaine.
      // Apr 13 → Apr 13 ancre, offset 0 = OFF
      // Apr 14 → Apr 13 ancre, offset 1 = TRAVAIL
      // Apr 15 → Apr 13 ancre, offset 2 = PRE-NIGHT
      // Apr 16 → Apr 13 ancre, offset 3 = POST-NIGHT
      // Apr 17 → Apr 13 ancre, offset 4 = OFF
      const [offEvents, travailEvents, nuitEvents, postEvents, off2Events] = await Promise.all([
        source.fetchEvents(DAY_OFF, DAY_TRAVAIL),
        source.fetchEvents(DAY_TRAVAIL, DAY_NUIT),
        source.fetchEvents(DAY_NUIT, DAY_POST_NUIT),
        source.fetchEvents(DAY_POST_NUIT, DAY_OFF2),
        source.fetchEvents(DAY_OFF2, '2026-04-18'),
      ]);

      expect(offEvents).toHaveLength(0);

      expect(travailEvents).toHaveLength(1);
      expect(travailEvents[0]!.title).toBe('Shift Jour');

      expect(nuitEvents).toHaveLength(1);
      expect(nuitEvents[0]!.title).toBe('Shift Nuit');

      expect(postEvents).toHaveLength(0);
      expect(off2Events).toHaveLength(0);
    });

    it('les jours OFF et POST-NIGHT ne génèrent aucun event', async () => {
      const offEvents  = await source.fetchEvents(DAY_OFF, DAY_TRAVAIL);        // offset 0
      const postEvents = await source.fetchEvents(DAY_POST_NUIT, DAY_OFF2);     // offset 3
      const off2Events = await source.fetchEvents(DAY_OFF2, '2026-04-18');      // offset 4

      expect(offEvents).toHaveLength(0);
      expect(postEvents).toHaveLength(0);
      expect(off2Events).toHaveLength(0);
    });

    it("un jour TRAVAIL ne génère qu'un seul event (Shift Jour, pas de Shift Nuit ce même jour)", async () => {
      const events = await source.fetchEvents(DAY_TRAVAIL, DAY_NUIT);

      expect(events).toHaveLength(1);
      expect(events[0]!.title).toBe('Shift Jour');
      expect(events.filter((e) => e.title === 'Shift Nuit')).toHaveLength(0);
    });

    it('un jour PRE-NIGHT ne génère qu\'un seul event (Shift Nuit, pas de Shift Jour ce même jour)', async () => {
      const events = await source.fetchEvents(DAY_NUIT, DAY_POST_NUIT);

      expect(events).toHaveLength(1);
      expect(events[0]!.title).toBe('Shift Nuit');
      expect(events.filter((e) => e.title === 'Shift Jour')).toHaveLength(0);
    });

    it('le nombre d\'events sur 14 jours est raisonnable (entre 4 et 8, pas 28)', async () => {
      const events = await source.fetchEvents(FROM, TO);

      expect(events.length).toBeGreaterThanOrEqual(4);
      expect(events.length).toBeLessThanOrEqual(8);
    });
  });

  // -------------------------------------------------------------------------
  // IDs uniques
  // -------------------------------------------------------------------------

  describe('unicité des IDs', () => {
    it('chaque event a un id unique dans la plage retournée', async () => {
      const events = await source.fetchEvents(FROM, TO);
      const ids = events.map((e) => e.id);
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
  // Cas limite — plage d'un seul jour de travail
  // -------------------------------------------------------------------------

  describe("fetchEvents avec plage d'un jour de travail (offset 1)", () => {
    it("retourne exactement 1 event pour un jour TRAVAIL (Apr 14)", async () => {
      // Apr 14 = offset 1 depuis ancre Apr 13 → Shift Jour
      const events = await source.fetchEvents(DAY_TRAVAIL, DAY_NUIT);

      expect(events.length).toBe(1);
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
      await expect(source.fetchEvents(FROM, TO)).resolves.toBeDefined();
    });
  });
});
