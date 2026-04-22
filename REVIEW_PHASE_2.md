# Review Phase 2 — Vue semaine read-only

**Date :** 2026-04-22  
**Tests :** 16 fichiers / 144 tests / 0 failing  
**TypeScript :** 0 erreur (`tsc --noEmit`)

---

## Résumé

La Phase 2 est solide : architecture SOLID respectée (séparation calcul/rendu dans `layout.ts` vs composants, `useMemo` dans `useLayoutForDay`), TDD strict appliqué sur T1/T6/T13, aucune couleur hexa en dur, named exports partout. Deux erreurs de compilation bloquantes ont été corrigées post-review (`exactOptionalPropertyTypes` sur `isEvent` dans `useLayoutForDay`, import inutilisé dans `WeekGrid.test`). Plusieurs findings mineurs restent en parking conscient pour Phase 3 (ARIA rows, ARIA sur les tuiles, event segments asymétriques).

---

## Findings

| Sévérité | Fichier | Description | Statut |
|---|---|---|---|
| **Critical** | `useLayoutForDay.ts:50` | `exactOptionalPropertyTypes` : `isEvent: boolean \| undefined` non assignable à `isEvent?: boolean` — spread conditionnel requis | ✅ Corrigé |
| **Critical** | `WeekGrid.test.tsx:3` | Import `CalendarEvent` inutilisé → erreur TS6133 | ✅ Corrigé |
| **Major** | `HourRows.tsx:11` | CSS var fantôme `--grid-hour-height` jamais définie — retombait sur fallback hardcodé `64px` au lieu d'importer `HOUR_HEIGHT_PX` | ✅ Corrigé |
| **Major** | `WeekGrid.tsx:86` | Code mort : `aria-hidden={i > 0 ? undefined : undefined}` toujours `undefined` + `i` non utilisé → erreur TS6133 | ✅ Corrigé |
| **Major** | `DayColumn.tsx:52` | `React.ReactNode` utilisé sans import explicite | ✅ Corrigé |
| **Major** | `EventTile.tsx:27` | `React.CSSProperties` utilisé sans import explicite | ✅ Corrigé |
| **Major** | `WeekGrid.tsx:29` | `role="row"` (header jours) déclaré hors de `role="grid"` — arbre ARIA invalide per ARIA 1.2 spec | 🅿️ Parking Phase 3 |
| **Major** | `DayColumn` / `WeekGrid` | `role="gridcell"` non wrappés dans un `role="row"` à l'intérieur du `role="grid"` — navigation clavier assistive cassée | 🅿️ Parking Phase 3 |
| **Minor** | `EventTile.tsx` | `event.color` (venu de gcal, potentiellement hexa) assigné directement à `--event-accent` sans commentaire justifiant l'exception à la règle `material-tokens` | 🅿️ Parking |
| **Minor** | `BlockTile.tsx`, `EventTile.tsx` | Aucun `role` ni `aria-label` sur les tuiles — debt accessibilité à anticiper avant Phase 3 (drag) | 🅿️ Parking Phase 3 |
| **Minor** | `DayColumn.tsx` | Events multi-jours traités par `EventTile` sans prop `segment` — visuellement incohérent avec `BlockTile` (bords asymétriques absents) | 🅿️ Parking Phase 3 |
| **Minor** | `WeekGrid.tsx` | Header jours inline dans `WeekGrid` (~25 lignes) — extraire un `DayColumnHeader` quand Phase 3 ajoute les interactions | 🅿️ Parking Phase 3 |
| **Info** | `HourRows.test.tsx` | 1 seul test (24 labels rendus) — pas de test sur la hauteur calculée | 🅿️ Acceptable Phase 2 |
| **Info** | `useCurrentTime.ts` | `useEffect` pour `setInterval` : usage légitime (side effect avec cleanup), pas une synchronisation d'état dérivé | ✅ Conforme |

---

## Tests E2E recommandés (Playwright)

1. **Navigation semaine desktop** — clic "Suivante" puis "Précédente" : `selectedWeekStart` revient à la valeur initiale, 7 colonnes visibles.
2. **Sélection jour mobile (375×667)** — clic sur pastille `DayStrip` → vue jour unique, `DayColumn` correspondant visible, autres masqués (CSS `hidden sm:block`).
3. **NowIndicator visible** — colonne d'aujourd'hui : trait rouge présent. Autres colonnes : absent.
4. **Blocs chevauchants** — 2 `BlockInstance` qui se chevauchent → tuiles à 50% de largeur chacune, sans débordement.
5. **Bloc traversant minuit** — `BlockInstance` 23h→01h → segment `#start` fin de jour J, segment `#end` début de jour J+1, bords asymétriques visibles.
6. **Scroll vertical** — desktop : colonne horaire sticky reste visible à droite lors du scroll, toutes les `DayColumn` défilent ensemble.

---

## Smoke test Playwright (pseudocode)

```ts
// Desktop 1280×800
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5173');
await expect(page.getByRole('navigation', { name: 'Navigation semaine' })).toBeVisible();
await expect(page.getByRole('grid', { name: 'Grille semaine' })).toBeVisible();
const columns = await page.getByRole('gridcell').count();
expect(columns).toBe(7);
// NowIndicator dans la colonne du jour courant
await expect(page.getByRole('presentation')).toBeVisible();
// Navigation
await page.getByRole('button', { name: 'Semaine suivante' }).click();
// Vérifier que le label de semaine a changé (+7j)

// Mobile 375×667
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:5173');
await expect(page.getByRole('tablist', { name: 'Jours de la semaine' })).toBeVisible();
const tabs = await page.getByRole('tab').count();
expect(tabs).toBe(7);
await page.getByRole('tab').nth(2).click();
await expect(page.getByRole('tab').nth(2)).toHaveAttribute('aria-selected', 'true');
// Seule la DayColumn du jour sélectionné est visible (pas hidden)
```

---

## Checklist Phase 2

- [x] T1 `layout.ts` — 13 tests, couverture > 90%
- [x] T2 `HourRows` — rendu 24 lignes
- [x] T3 `NowIndicator` — conditionnel `isToday`
- [x] T4 `BlockTile` — segments, label tronqué, `data-testid`
- [x] T5 `EventTile` — `--event-accent`, bord gauche coloré
- [x] T6 `useLayoutForDay` — TDD, split minuit, overlap, event col 1
- [x] T7 `DayColumn` — `role="gridcell"`, blocs + events + NowIndicator
- [x] T8 `WeekGrid` — 7 colonnes, `role="grid"`, store connecté
- [x] T9 `WeekNavBar` — navigation prev/next/today, store mis à jour
- [x] T10 `DayStrip` — 7 pastilles, sélection, responsive `hidden sm:flex`
- [x] T11 `App.tsx` + barrel `index.ts` — grille semaine affichée
- [x] T12 `constants/grid.ts` — `HOUR_HEIGHT_PX = 64`
- [x] T13 `useCurrentTime` — TDD, fake timers, clearInterval au unmount
- [x] 0 `console.log` commité
- [x] 0 couleur hexa en dur
- [x] 0 `any` TypeScript
- [x] `tsc --noEmit` : 0 erreur
- [x] 144/144 tests verts
- [ ] Smoke test Playwright (à lancer manuellement)
- [ ] Commit `feat(phase-2): vue semaine read-only` + tag `v0.2`
