// Stabilise les comparaisons de timezone dans tout ce fichier
process.env['TZ'] = 'Europe/Paris';

import { describe, it, expect } from 'vitest';
import { instantiateTemplate } from '@/lib/templateEngine';
import { DEFAULT_DAY_TEMPLATES } from '@/constants/templates';
import { toAbsoluteISO } from '@/lib/datetime';
import type { CalendarEvent, DayTemplate, BlockTemplate } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEvent(id: string, start: string, end: string): CalendarEvent {
  return { id, source: 'gcal', calendarId: 'test', title: 'Event', start, end };
}

function makeCounter(): () => string {
  let n = 0;
  return () => String(++n);
}

// Raccourcis vers les templates utilisés dans les tests
const offTemplate = DEFAULT_DAY_TEMPLATES[0]!; // id: 'off', 8 blocs
const preNightTemplate = DEFAULT_DAY_TEMPLATES[1]!; // id: 'pre-night', 8 blocs

const DATE = '2026-04-21';

// ---------------------------------------------------------------------------
// T1.10 — Cas nominaux
// ---------------------------------------------------------------------------

describe('instantiateTemplate', () => {
  describe('cas nominaux', () => {
    it("retourne autant d'instances que de blocs dans le template OFF sans events", () => {
      // Arrange
      const events: CalendarEvent[] = [];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      expect(result).toHaveLength(8);
    });

    it('chaque instance a sourceTemplateId correspondant au id du BlockTemplate', () => {
      // Arrange
      const events: CalendarEvent[] = [];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const blockIds = offTemplate.blocks.map((b) => b.id);
      for (const instance of result) {
        expect(blockIds).toContain(instance.sourceTemplateId);
      }
    });

    it('les start et end des instances sont des strings ISO valides', () => {
      // Arrange
      const events: CalendarEvent[] = [];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      for (const instance of result) {
        expect(new Date(instance.start).toString()).not.toBe('Invalid Date');
        expect(new Date(instance.end).toString()).not.toBe('Invalid Date');
      }
    });

    it('le bloc off-sport (07:30, 90 min) a end correspondant a 09:00 Europe/Paris', () => {
      // Arrange
      const events: CalendarEvent[] = [];
      const expectedEnd = toAbsoluteISO(DATE, '09:00');

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const sportInstance = result.find((i) => i.sourceTemplateId === 'off-sport');
      expect(sportInstance).toBeDefined();
      expect(sportInstance!.end).toBe(expectedEnd);
    });

    it('le bloc pre-night-shift-nuit (19:00, 720 min) a end sur J+1 a 07:00 Europe/Paris', () => {
      // Arrange
      const events: CalendarEvent[] = [];
      const expectedEnd = toAbsoluteISO('2026-04-22', '07:00');

      // Act
      const result = instantiateTemplate(preNightTemplate, DATE, events, makeCounter());

      // Assert
      const nuitInstance = result.find((i) => i.sourceTemplateId === 'pre-night-shift-nuit');
      expect(nuitInstance).toBeDefined();
      expect(nuitInstance!.end).toBe(expectedEnd);
    });

    it('chaque instance a un id unique (aucun doublon)', () => {
      // Arrange
      const events: CalendarEvent[] = [];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const ids = result.map((i) => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("idGenerator optionnel produit des IDs deterministes via un compteur", () => {
      // Arrange
      const events: CalendarEvent[] = [];
      const counter = makeCounter();

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, counter);

      // Assert
      const ids = result.map((i) => i.id);
      expect(ids).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    });
  });

  // ---------------------------------------------------------------------------
  // T1.11 — Conflits gcal
  // ---------------------------------------------------------------------------

  describe('conflits gcal', () => {
    it("un bloc normal chevauche partiellement un event gcal -> bloc retracte (end = start de l'event)", () => {
      // Arrange — off-sport : 07:30→09:00, event : 08:00→10:00
      const eventStart = toAbsoluteISO(DATE, '08:00');
      const eventEnd = toAbsoluteISO(DATE, '10:00');
      const events = [makeEvent('ev-1', eventStart, eventEnd)];
      const expectedStart = toAbsoluteISO(DATE, '07:30');
      const expectedEnd = toAbsoluteISO(DATE, '08:00');

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const sportInstance = result.find((i) => i.sourceTemplateId === 'off-sport');
      expect(sportInstance).toBeDefined();
      expect(sportInstance!.start).toBe(expectedStart);
      expect(sportInstance!.end).toBe(expectedEnd);
    });

    it('apres retraction, duree restante >= 15 min -> bloc conserve', () => {
      // Arrange — off-sport : 07:30→09:00 (90 min), event : 08:00→10:00 -> reste 30 min >= 15
      const eventStart = toAbsoluteISO(DATE, '08:00');
      const eventEnd = toAbsoluteISO(DATE, '10:00');
      const events = [makeEvent('ev-2', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const sportInstance = result.find((i) => i.sourceTemplateId === 'off-sport');
      expect(sportInstance).toBeDefined();
    });

    it('apres retraction, duree restante < 15 min -> bloc absent du resultat', () => {
      // Arrange — off-sport : 07:30→09:00, event : 07:35→10:00 -> reste 5 min < 15
      const eventStart = toAbsoluteISO(DATE, '07:35');
      const eventEnd = toAbsoluteISO(DATE, '10:00');
      const events = [makeEvent('ev-3', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const sportInstance = result.find((i) => i.sourceTemplateId === 'off-sport');
      expect(sportInstance).toBeUndefined();
    });

    it("bloc fixed:true qui chevauche un event -> absent du resultat", () => {
      // Arrange — off-coucher : fixed:true, 22:00, 15 min → 22:15, event : 21:00→23:00
      const eventStart = toAbsoluteISO(DATE, '21:00');
      const eventEnd = toAbsoluteISO(DATE, '23:00');
      const events = [makeEvent('ev-4', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const coucherInstance = result.find((i) => i.sourceTemplateId === 'off-coucher');
      expect(coucherInstance).toBeUndefined();
    });

    it("bloc fixed:true sans chevauchement -> inclus normalement", () => {
      // Arrange — off-coucher : fixed:true, 22:00, 15 min, event eloigne du bloc
      const eventStart = toAbsoluteISO(DATE, '10:00');
      const eventEnd = toAbsoluteISO(DATE, '11:00');
      const events = [makeEvent('ev-5', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const coucherInstance = result.find((i) => i.sourceTemplateId === 'off-coucher');
      expect(coucherInstance).toBeDefined();
    });

    it("event gcal entierement contenu dans un bloc -> bloc tronque sur bord gauche, residu < 15 min -> supprime", () => {
      // Arrange — off-reno-1 : 09:30→13:00 (210 min), event : 09:31→13:00 -> reste 1 min < 15
      const eventStart = toAbsoluteISO(DATE, '09:31');
      const eventEnd = toAbsoluteISO(DATE, '13:00');
      const events = [makeEvent('ev-6', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(offTemplate, DATE, events, makeCounter());

      // Assert
      const renoInstance = result.find((i) => i.sourceTemplateId === 'off-reno-1');
      expect(renoInstance).toBeUndefined();
    });

    it("bloc allowOverlap:true -> pose tel quel meme si chevauchement avec un event", () => {
      // Arrange — template custom avec un bloc allowOverlap:true qui chevauche un event
      const customBlock: BlockTemplate = {
        id: 'custom-overlap',
        label: 'Bloc overlap',
        category: 'perso',
        start: '09:00',
        duration: 60,
        allowOverlap: true,
      };
      const customTemplate: DayTemplate = {
        id: 'off',
        label: 'Custom',
        blocks: [customBlock],
      };
      const eventStart = toAbsoluteISO(DATE, '09:15');
      const eventEnd = toAbsoluteISO(DATE, '09:45');
      const events = [makeEvent('ev-7', eventStart, eventEnd)];

      // Act
      const result = instantiateTemplate(customTemplate, DATE, events, makeCounter());

      // Assert
      const overlapInstance = result.find((i) => i.sourceTemplateId === 'custom-overlap');
      expect(overlapInstance).toBeDefined();
      // start et end inchanges par rapport au template
      expect(overlapInstance!.start).toBe(toAbsoluteISO(DATE, '09:00'));
      expect(overlapInstance!.end).toBe(toAbsoluteISO(DATE, '10:00'));
    });
  });
});
