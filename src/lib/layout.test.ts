import { describe, it, expect } from 'vitest';
import { computeLayout } from '@/lib/layout';
import type { LayoutItem, LayoutResult } from '@/lib/layout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function item(
  id: string,
  startHour: number,
  endHour: number,
  isEvent?: boolean,
): LayoutItem {
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = '2024-01-01T';
  return {
    id,
    start: `${base}${pad(startHour)}:00:00.000Z`,
    end: `${base}${pad(endHour)}:00:00.000Z`,
    ...(isEvent !== undefined ? { isEvent } : {}),
  };
}

function resultFor(results: LayoutResult[], id: string): LayoutResult {
  const found = results.find((r) => r.id === id);
  if (found === undefined) throw new Error(`id "${id}" absent du résultat`);
  return found;
}

// ---------------------------------------------------------------------------
// computeLayout
// ---------------------------------------------------------------------------

describe('computeLayout', () => {
  // -------------------------------------------------------------------------
  // Cas 1 : liste vide
  // -------------------------------------------------------------------------
  it('retourne un tableau vide quand la liste en entrée est vide', () => {
    // Arrange / Act
    const result = computeLayout([]);

    // Assert
    expect(result).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Cas 2 : item unique
  // -------------------------------------------------------------------------
  it('assigne colonne 1 et totalColumns 1 pour un seul item sans chevauchement', () => {
    // Arrange
    const items: LayoutItem[] = [item('a', 8, 9)];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(1);
    expect(resultFor(result, 'a')).toEqual({ id: 'a', column: 1, totalColumns: 1 });
  });

  // -------------------------------------------------------------------------
  // Cas 3 : deux items qui se chevauchent
  // -------------------------------------------------------------------------
  it('assigne des colonnes 1 et 2 pour deux items qui se chevauchent', () => {
    // Arrange
    const items: LayoutItem[] = [item('a', 8, 10), item('b', 9, 11)];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(2);
    const a = resultFor(result, 'a');
    const b = resultFor(result, 'b');
    expect(a.column).toBe(1);
    expect(b.column).toBe(2);
    expect(a.totalColumns).toBe(2);
    expect(b.totalColumns).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Cas 4 : trois items qui se chevauchent tous
  // -------------------------------------------------------------------------
  it('assigne les colonnes 1, 2 et 3 pour trois items qui se chevauchent simultanément', () => {
    // Arrange
    const items: LayoutItem[] = [
      item('a', 8, 11),
      item('b', 8, 11),
      item('c', 8, 11),
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(3);
    const columns = result.map((r) => r.column).sort((x, y) => x - y);
    expect(columns).toEqual([1, 2, 3]);
    result.forEach((r) => { expect(r.totalColumns).toBe(3); });
  });

  // -------------------------------------------------------------------------
  // Cas 5 : quatre items qui se chevauchent → throw
  // -------------------------------------------------------------------------
  it('lève une erreur "Max 3 colonnes dépassé" quand quatre items se chevauchent simultanément', () => {
    // Arrange
    const items: LayoutItem[] = [
      item('a', 8, 11),
      item('b', 8, 11),
      item('c', 8, 11),
      item('d', 8, 11),
    ];

    // Act / Assert
    expect(() => computeLayout(items)).toThrow('Max 3 colonnes dépassé');
  });

  // -------------------------------------------------------------------------
  // Cas 6 : item isEvent forcé en colonne 1
  // -------------------------------------------------------------------------
  it('place un item isEvent en colonne 1 et pousse le bloc normal en colonne 2 quand ils se chevauchent', () => {
    // Arrange
    const items: LayoutItem[] = [
      item('bloc', 9, 10),
      item('evt', 9, 10, true),
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(2);
    expect(resultFor(result, 'evt').column).toBe(1);
    expect(resultFor(result, 'bloc').column).toBe(2);
    expect(resultFor(result, 'evt').totalColumns).toBe(2);
    expect(resultFor(result, 'bloc').totalColumns).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Cas 7 : bords jointifs — end == start du suivant → pas de chevauchement
  // -------------------------------------------------------------------------
  it('traite deux items aux bords jointifs (end == start) comme deux composantes séparées', () => {
    // Arrange : A finit à 09:00, B commence à 09:00
    const items: LayoutItem[] = [
      {
        id: 'a',
        start: '2024-01-01T08:00:00.000Z',
        end: '2024-01-01T09:00:00.000Z',
      },
      {
        id: 'b',
        start: '2024-01-01T09:00:00.000Z',
        end: '2024-01-01T10:00:00.000Z',
      },
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(2);
    expect(resultFor(result, 'a')).toEqual({ id: 'a', column: 1, totalColumns: 1 });
    expect(resultFor(result, 'b')).toEqual({ id: 'b', column: 1, totalColumns: 1 });
  });

  // -------------------------------------------------------------------------
  // Cas 8 : deux groupes séparés — composantes connexes indépendantes
  // -------------------------------------------------------------------------
  it('calcule totalColumns indépendamment pour chaque composante connexe', () => {
    // Arrange : A+B se chevauchent ; C est seul (après A et B)
    const items: LayoutItem[] = [
      item('a', 8, 10),
      item('b', 9, 11),
      item('c', 14, 15),
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(3);
    expect(resultFor(result, 'a').totalColumns).toBe(2);
    expect(resultFor(result, 'b').totalColumns).toBe(2);
    expect(resultFor(result, 'c').totalColumns).toBe(1);
    expect(resultFor(result, 'c').column).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Cas 9 : item isEvent seul → colonne 1, totalColumns 1
  // -------------------------------------------------------------------------
  it('retourne colonne 1 et totalColumns 1 pour un item isEvent sans chevauchement', () => {
    // Arrange
    const items: LayoutItem[] = [item('evt', 10, 11, true)];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(1);
    expect(resultFor(result, 'evt')).toEqual({ id: 'evt', column: 1, totalColumns: 1 });
  });

  // -------------------------------------------------------------------------
  // Cas 10 : deux items isEvent qui se chevauchent
  // -------------------------------------------------------------------------
  it('place le premier event en colonne 1 et le deuxième event en colonne 2 quand ils se chevauchent', () => {
    // Arrange : les events sont prioritaires (placés en premiers) mais le conflit
    // est résolu par first-fit — le second event prend la colonne 2.
    const items: LayoutItem[] = [
      item('evt1', 9, 11, true),
      item('evt2', 10, 12, true),
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(2);
    // Les deux events passent en premier dans le first-fit ;
    // evt1 prend la col 1, evt2 ne peut pas prendre la col 1 (conflit) → col 2.
    expect(resultFor(result, 'evt1').column).toBe(1);
    expect(resultFor(result, 'evt2').column).toBe(2);
    expect(resultFor(result, 'evt1').totalColumns).toBe(2);
    expect(resultFor(result, 'evt2').totalColumns).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Cas limites supplémentaires
  // -------------------------------------------------------------------------

  it('lève une erreur quand exactement 3 items se chevauchent et qu\'un quatrième s\'ajoute sans chevaucher les 3', () => {
    // Arrange : A, B, C se chevauchent (3 colonnes) ; D chevauche uniquement B et C (pas A)
    // → à l'instant où B, C, D se chevauchent, D peut prendre la col laissée par A
    //   donc PAS de throw ici. Ce test vérifie que le throw est réservé à l'impossibilité réelle.
    const items: LayoutItem[] = [
      item('a', 8, 10),   // col 1
      item('b', 8, 11),   // col 2
      item('c', 8, 11),   // col 3
      item('d', 9, 10),   // chevauche b et c mais peut prendre col 1 si a libéré... non, a est 8-10
    ];
    // a, b, c, d se chevauchent tous à 09:00-10:00 → 4 items simultanés → throw
    expect(() => computeLayout(items)).toThrow('Max 3 colonnes dépassé');
  });

  it('assigne colonne 1 à un item normal seul quand il n\'y a pas de chevauchement avec un event dans un autre groupe', () => {
    // Arrange : un event de 08:00 à 09:00, un bloc normal de 10:00 à 11:00 — pas de chevauchement
    const items: LayoutItem[] = [
      item('evt', 8, 9, true),
      item('bloc', 10, 11),
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(result).toHaveLength(2);
    expect(resultFor(result, 'evt')).toEqual({ id: 'evt', column: 1, totalColumns: 1 });
    expect(resultFor(result, 'bloc')).toEqual({ id: 'bloc', column: 1, totalColumns: 1 });
  });

  it('ne considère pas un chevauchement quand start === end entre deux items distincts (symétrie)', () => {
    // Arrange : C finit quand D commence — vérification de la condition stricte dans les deux sens
    const items: LayoutItem[] = [
      {
        id: 'c',
        start: '2024-01-01T12:00:00.000Z',
        end: '2024-01-01T13:00:00.000Z',
      },
      {
        id: 'd',
        start: '2024-01-01T13:00:00.000Z',
        end: '2024-01-01T14:00:00.000Z',
      },
    ];

    // Act
    const result = computeLayout(items);

    // Assert
    expect(resultFor(result, 'c').totalColumns).toBe(1);
    expect(resultFor(result, 'd').totalColumns).toBe(1);
  });
});
