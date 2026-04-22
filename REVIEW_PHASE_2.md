# Review Phase 2 — Vue semaine read-only

**Date :** 2026-04-22  
**Tests :** 16 fichiers / 146 tests / 0 failing  
**TypeScript :** 0 erreur (`tsc --noEmit`)  
**ESLint :** ✅ 0 erreur (`npm run lint`)  
**Build :** ✅ (`npm run build` — 322 kB JS / 11 kB CSS)

---

## Résumé

Phase 2 complète. Tous les checks statiques sont verts. L'architecture SOLID est respectée (séparation calcul/rendu dans `layout.ts` vs composants, `useMemo` dans `useLayoutForDay`), le TDD strict a été appliqué sur T1/T6/T13, 0 couleur hexa en dur, named exports partout. Trois correctifs post-implémentation ont été apportés :

1. **`fix(template-engine): guard against invalid date input`** — `instantiateTemplate` retourne `[]` + `logger.warn` au lieu de lever `RangeError: Invalid time value` sur une date invalide.
2. **`fix(lint): apply typescript-eslint strictTypeChecked fixes`** — 17 erreurs ESLint corrigées (`restrict-template-expressions`, `no-unsafe-assignment`, `no-confusing-void-expression`, `no-deprecated`).
3. **`fix(calendar): realistic 5-day shift cycle for mock source`** — `MockCalendarSource` génère maintenant un cycle réaliste au lieu de créer des events gcal sur chaque jour (qui supprimait tous les blocs template via SPEC §4.1).

Les findings ARIA (structure `role="row"` hors `role="grid"`) restent en parking conscient Phase 3.

> **Note Playwright :** Le MCP Playwright a été reconfiguré (`@playwright/mcp` remplace l'ancien package obsolète). Actif après redémarrage de session. Les checks visuels sont documentés en pseudocode — à exécuter lors de la Phase 3 ou manuellement via `npm run dev`.

---

## Findings corrigés lors de cette review

| Sévérité | Fichier | Description | Statut |
|---|---|---|---|
| **Critical** | `templateEngine.ts:28` | `dayjs.tz` sur date invalide → `RangeError: Invalid time value` non capturé. Guard ajouté + test | ✅ Corrigé |
| **Blocker** | `eslint.config.js` + 5 composants | `restrict-template-expressions` : 12 occurrences de `${number}` dans template literals | ✅ Corrigé |
| **Blocker** | `layout.ts:79` | `no-unsafe-assignment` : `new Array(n).fill(0)` inféré `any[]` | ✅ Corrigé |
| **Blocker** | `DayStrip.tsx:36`, `layout.test.ts:100` | `no-confusing-void-expression` : arrow shorthand retournant void | ✅ Corrigé |
| **Blocker** | `layout.test.ts:116,243` | `no-deprecated` : `.toThrowError(...)` → `.toThrow(...)` | ✅ Corrigé |

---

## Findings précédents corrigés (récapitulatif complet)

| Sévérité | Fichier | Description |
|---|---|---|
| **Critical** | `calendarSource.ts` | Mock générait Shift Jour + Nuit chaque jour → SPEC §4.1 supprimait tous les blocs | ✅ |
| **Critical** | `useLayoutForDay.ts:50` | `exactOptionalPropertyTypes` : spread conditionnel requis | ✅ |
| **Critical** | `WeekGrid.test.tsx:3` | Import `CalendarEvent` inutilisé → TS6133 | ✅ |
| **Major** | `HourRows.tsx:11` | CSS var fantôme `--grid-hour-height` → `HOUR_HEIGHT_PX` importé | ✅ |
| **Major** | `WeekGrid.tsx:86` | Code mort `aria-hidden` + variable `i` non utilisée | ✅ |
| **Major** | `DayColumn.tsx` | `React.ReactNode` sans import explicite | ✅ |
| **Major** | `EventTile.tsx` | `React.CSSProperties` sans import explicite | ✅ |

---

## Findings en parking Phase 3

| Sévérité | Fichier | Description |
|---|---|---|
| **Major** | `WeekGrid.tsx:29` | `role="row"` (header jours) hors de `role="grid"` — arbre ARIA invalide per ARIA 1.2 spec | 🅿️ Phase 3 |
| **Major** | `DayColumn` / `WeekGrid` | `role="gridcell"` non wrappés dans `role="row"` — navigation clavier assistive cassée | 🅿️ Phase 3 |
| **Minor** | `EventTile.tsx` | `event.color` (gcal) assigné à `--event-accent` sans commentaire exception `material-tokens` | 🅿️ |
| **Minor** | `BlockTile.tsx`, `EventTile.tsx` | Aucun `role` ni `aria-label` sur les tuiles | 🅿️ Phase 3 |
| **Minor** | `DayColumn.tsx` | Events multi-jours sans prop `segment` sur `EventTile` — bords asymétriques absents | 🅿️ Phase 3 |
| **Minor** | `WeekGrid.tsx` | Header jours inline (~25 lignes) — extraire `DayColumnHeader` en Phase 3 | 🅿️ Phase 3 |

---

## Checks Playwright — pseudocode (MCP reconfiguré, actif après redémarrage)

```ts
// Desktop 1280×800
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5173');
await expect(page.getByRole('grid', { name: 'Grille semaine' })).toBeVisible();
const columns = await page.getByRole('columnheader').count();
expect(columns).toBe(7);
await expect(page.getByRole('presentation')).toBeVisible(); // NowIndicator

await page.getByRole('button', { name: 'Semaine suivante' }).click();
// vérifier label semaine +7j
await page.getByRole('button', { name: "Aujourd'hui" }).click();
// vérifier retour semaine courante

// Mobile 375×667
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:5173');
await expect(page.getByRole('tablist', { name: 'Jours de la semaine' })).toBeVisible();
expect(await page.getByRole('tab').count()).toBe(7);
await page.getByRole('tab').nth(2).click();
await expect(page.getByRole('tab').nth(2)).toHaveAttribute('aria-selected', 'true');
```

Points de vérification manuelle (à documenter en Phase 3 avec screenshots) :
- 7 colonnes Lun→Dim + labels horaires 00:00–23:00 sans troncature
- Events gcal Shift Jour/Nuit sur les colonnes attendues (cycle 5 jours)
- NowIndicator ligne rouge sur la colonne du jour courant uniquement
- DayStrip scrollable, 1 seule colonne visible en mobile

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
- [x] MockCalendarSource — cycle 5 jours réaliste, 0 conflit systématique SPEC §4.1
- [x] Guard date invalide dans `instantiateTemplate` + test
- [x] 0 `console.log` commité
- [x] 0 couleur hexa en dur
- [x] 0 `any` TypeScript
- [x] `tsc --noEmit` : 0 erreur
- [x] `npm run lint` : 0 erreur
- [x] 146/146 tests verts
- [x] `npm run build` : succès (322 kB JS / 11 kB CSS)
- [x] MCP Playwright reconfiguré (`@playwright/mcp`)
- [ ] Smoke test Playwright (actif après redémarrage session)
- [ ] Commit `feat(phase-2): vue semaine read-only` + tag `v0.2`
