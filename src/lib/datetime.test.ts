// Stabilise les comparaisons de timezone dans tout ce fichier
process.env['TZ'] = 'Europe/Paris';

import dayjs from 'dayjs';
import {
  formatISODate,
  parseISODate,
  weekStartOf,
  addMinutes,
  toAbsoluteISO,
  splitAtMidnight,
} from '@/lib/datetime';

// ---------------------------------------------------------------------------
// formatISODate
// ---------------------------------------------------------------------------

describe('formatISODate', () => {
  it('retourne la date au format YYYY-MM-DD pour un Dayjs donne', () => {
    // Arrange
    const date = dayjs('2026-04-20T14:30:00');

    // Act
    const result = formatISODate(date);

    // Assert
    expect(result).toBe('2026-04-20');
  });

  it('retourne la partie date uniquement, sans heure', () => {
    // Arrange
    const date = dayjs('2026-01-01T00:00:00');

    // Act
    const result = formatISODate(date);

    // Assert
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2026-01-01');
  });

  it('gere une date en fin de mois sans deborder sur le mois suivant', () => {
    // Arrange
    const date = dayjs('2026-01-31T23:59:59');

    // Act
    const result = formatISODate(date);

    // Assert
    expect(result).toBe('2026-01-31');
  });
});

// ---------------------------------------------------------------------------
// parseISODate
// ---------------------------------------------------------------------------

describe('parseISODate', () => {
  it('parse une string YYYY-MM-DD et retourne un Dayjs valide', () => {
    // Arrange
    const s = '2026-04-20';

    // Act
    const result = parseISODate(s);

    // Assert
    expect(result.isValid()).toBe(true);
    expect(result.year()).toBe(2026);
    expect(result.month()).toBe(3); // 0-indexed : avril = 3
    expect(result.date()).toBe(20);
  });

  it('retourne un Dayjs en timezone Europe/Paris avec offset +120 en ete', () => {
    // Arrange
    const s = '2026-04-20'; // heure ete UTC+2

    // Act
    const result = parseISODate(s);

    // Assert
    expect(result.utcOffset()).toBe(120);
  });

  it('retourne un Dayjs en timezone Europe/Paris avec offset +60 en hiver', () => {
    // Arrange
    const s = '2026-01-15'; // heure hiver UTC+1

    // Act
    const result = parseISODate(s);

    // Assert
    expect(result.utcOffset()).toBe(60);
  });

  it('parse un ISO datetime complet avec heure', () => {
    // Arrange
    const s = '2026-04-20T09:00:00';

    // Act
    const result = parseISODate(s);

    // Assert
    expect(result.isValid()).toBe(true);
    expect(result.hour()).toBe(9);
  });

  it('retourne un Dayjs invalide pour une string vide', () => {
    // Arrange
    const s = '';

    // Act
    const result = parseISODate(s);

    // Assert
    expect(result.isValid()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// weekStartOf
// ---------------------------------------------------------------------------

describe('weekStartOf', () => {
  it('retourne le lundi de la semaine pour un mercredi', () => {
    // Arrange
    const wednesday = dayjs('2026-04-22'); // mercredi

    // Act
    const result = weekStartOf(wednesday);

    // Assert
    expect(formatISODate(result)).toBe('2026-04-20');
    expect(result.day()).toBe(1); // 1 = lundi (dimanche = 0)
  });

  it('retourne la date elle-meme quand elle est deja un lundi', () => {
    // Arrange
    const monday = dayjs('2026-04-20'); // lundi

    // Act
    const result = weekStartOf(monday);

    // Assert
    expect(formatISODate(result)).toBe('2026-04-20');
    expect(result.day()).toBe(1);
  });

  it('retourne le lundi precedent pour un dimanche (fin de semaine ISO)', () => {
    // Arrange
    const sunday = dayjs('2026-04-26'); // dimanche

    // Act
    const result = weekStartOf(sunday);

    // Assert
    expect(formatISODate(result)).toBe('2026-04-20');
    expect(result.day()).toBe(1);
  });

  it('retourne le lundi precedent pour un samedi', () => {
    // Arrange
    const saturday = dayjs('2026-04-25');

    // Act
    const result = weekStartOf(saturday);

    // Assert
    expect(formatISODate(result)).toBe('2026-04-20');
  });

  it('retourne un lundi correct pour une date traversant une frontiere de mois', () => {
    // Arrange
    const thursday = dayjs('2026-05-07'); // jeudi 7 mai -> lundi = 4 mai

    // Act
    const result = weekStartOf(thursday);

    // Assert
    expect(formatISODate(result)).toBe('2026-05-04');
  });
});

// ---------------------------------------------------------------------------
// addMinutes
// ---------------------------------------------------------------------------

describe('addMinutes', () => {
  it('ajoute des minutes a un ISO datetime simple', () => {
    // Arrange
    const isoDatetime = '2026-04-20T10:00:00+02:00';
    const minutes = 30;

    // Act
    const result = addMinutes(isoDatetime, minutes);

    // Assert
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(dayjs(result).hour()).toBe(10);
    expect(dayjs(result).minute()).toBe(30);
  });

  it('retourne une ISO string au format YYYY-MM-DDTHH:MM...', () => {
    // Arrange
    const isoDatetime = '2026-04-20T10:00:00+02:00';

    // Act
    const result = addMinutes(isoDatetime, 15);

    // Assert
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  it('gere le passage de jour : 23:30 + 60 minutes -> J+1 00:30', () => {
    // Arrange
    const isoDatetime = '2026-04-20T23:30:00+02:00';
    const minutes = 60;

    // Act
    const result = addMinutes(isoDatetime, minutes);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.year()).toBe(2026);
    expect(parsed.month()).toBe(3); // avril = 3 (0-indexed)
    expect(parsed.date()).toBe(21);
    expect(parsed.hour()).toBe(0);
    expect(parsed.minute()).toBe(30);
  });

  it('gere le passage de mois : 31 jan 23:45 + 30 minutes -> 1er fev 00:15', () => {
    // Arrange
    const isoDatetime = '2026-01-31T23:45:00+01:00';
    const minutes = 30;

    // Act
    const result = addMinutes(isoDatetime, minutes);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.month()).toBe(1); // fevrier = 1 (0-indexed)
    expect(parsed.date()).toBe(1);
    expect(parsed.hour()).toBe(0);
    expect(parsed.minute()).toBe(15);
  });

  it('accepte 0 minutes et retourne le meme instant', () => {
    // Arrange
    const isoDatetime = '2026-04-20T08:00:00+02:00';

    // Act
    const result = addMinutes(isoDatetime, 0);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.hour()).toBe(8);
    expect(parsed.minute()).toBe(0);
  });

  it('accepte des minutes negatives (soustraction)', () => {
    // Arrange
    const isoDatetime = '2026-04-20T08:00:00+02:00';
    const minutes = -30;

    // Act
    const result = addMinutes(isoDatetime, minutes);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.hour()).toBe(7);
    expect(parsed.minute()).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// toAbsoluteISO
// ---------------------------------------------------------------------------

describe('toAbsoluteISO', () => {
  it('combine YYYY-MM-DD et HH:MM en une ISO string valide', () => {
    // Arrange
    const date = '2026-04-20';
    const time = '09:00';

    // Act
    const result = toAbsoluteISO(date, time);

    // Assert
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(dayjs(result).isValid()).toBe(true);
  });

  it("encode l'offset ete +02:00 pour une date en avril (Europe/Paris)", () => {
    // Arrange
    const date = '2026-04-20'; // UTC+2
    const time = '09:00';

    // Act
    const result = toAbsoluteISO(date, time);

    // Assert
    expect(result).toMatch(/\+02:00$/);
  });

  it("encode l'offset hiver +01:00 pour une date en janvier (Europe/Paris)", () => {
    // Arrange
    const date = '2026-01-15'; // UTC+1
    const time = '09:00';

    // Act
    const result = toAbsoluteISO(date, time);

    // Assert
    expect(result).toMatch(/\+01:00$/);
  });

  it('gere minuit (00:00) sans changer la date locale', () => {
    // Arrange
    const date = '2026-04-20';
    const time = '00:00';

    // Act
    const result = toAbsoluteISO(date, time);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.hour()).toBe(0);
    expect(parsed.minute()).toBe(0);
    expect(result).toContain('2026-04-20');
  });

  it('gere 23:59', () => {
    // Arrange
    const date = '2026-04-20';
    const time = '23:59';

    // Act
    const result = toAbsoluteISO(date, time);

    // Assert
    const parsed = dayjs(result);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.hour()).toBe(23);
    expect(parsed.minute()).toBe(59);
  });
});

// ---------------------------------------------------------------------------
// splitAtMidnight
// ---------------------------------------------------------------------------

describe('splitAtMidnight', () => {
  it("retourne un segment 'single' pour un bloc dans la meme journee", () => {
    // Arrange
    const start = '2026-04-20T09:00:00+02:00';
    const end = '2026-04-20T10:30:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]?.segment).toBe('single');
    expect(result[0]?.start).toBe(start);
    expect(result[0]?.end).toBe(end);
  });

  it("retourne deux segments 'start' et 'end' pour un bloc traversant minuit", () => {
    // Arrange - shift nuit 19:00 -> 07:00 J+1
    const start = '2026-04-20T19:00:00+02:00';
    const end = '2026-04-21T07:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]?.segment).toBe('start');
    expect(result[1]?.segment).toBe('end');
  });

  it("le segment 'start' conserve start original et se termine a minuit J+1", () => {
    // Arrange
    const start = '2026-04-20T19:00:00+02:00';
    const end = '2026-04-21T07:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    const startSegment = result[0];
    expect(startSegment?.start).toBe(start);
    const endOfStartSegment = dayjs(startSegment?.end);
    expect(endOfStartSegment.hour()).toBe(0);
    expect(endOfStartSegment.minute()).toBe(0);
    expect(endOfStartSegment.date()).toBe(21);
  });

  it("le segment 'end' commence a minuit J+1 et conserve end original", () => {
    // Arrange
    const start = '2026-04-20T19:00:00+02:00';
    const end = '2026-04-21T07:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    const endSegment = result[1];
    expect(endSegment?.end).toBe(end);
    const startOfEndSegment = dayjs(endSegment?.start);
    expect(startOfEndSegment.hour()).toBe(0);
    expect(startOfEndSegment.minute()).toBe(0);
    expect(startOfEndSegment.date()).toBe(21);
  });

  it("retourne un segment 'single' pour un bloc demarrant exactement a minuit", () => {
    // Arrange - commence a 00:00, finit a 07:00 le meme jour
    const start = '2026-04-21T00:00:00+02:00';
    const end = '2026-04-21T07:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]?.segment).toBe('single');
  });

  it("retourne un segment 'single' pour un bloc se terminant exactement a minuit", () => {
    // Arrange - finit pile a 00:00 J+1 = minuit, le bloc reste sur J
    const start = '2026-04-20T22:00:00+02:00';
    const end = '2026-04-21T00:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]?.segment).toBe('single');
  });

  it('retourne un tableau vide si start est egal a end', () => {
    // Arrange
    const start = '2026-04-20T10:00:00+02:00';
    const end = '2026-04-20T10:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('retourne un tableau vide si start est apres end', () => {
    // Arrange
    const start = '2026-04-20T10:00:00+02:00';
    const end = '2026-04-20T09:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result).toHaveLength(0);
  });

  it("gere un bloc traversant deux nuits : premier segment 'start', dernier 'end'", () => {
    // Arrange - 19:00 lundi -> 07:00 mercredi (traverse deux midnights)
    const start = '2026-04-20T19:00:00+02:00';
    const end = '2026-04-22T07:00:00+02:00';

    // Act
    const result = splitAtMidnight(start, end);

    // Assert
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]?.segment).toBe('start');
    expect(result[result.length - 1]?.segment).toBe('end');
  });
});
