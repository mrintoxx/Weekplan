# CLAUDE.md

Fichier de référence pour Claude Code sur ce projet. **À lire en priorité** avant toute action.

---

## Contexte

Application web de planning par blocs, développée par un utilisateur TDAH pour structurer ses journées. Lire **`SPEC.md`** pour la spec complète.

Stack : Vite + React 19 + TypeScript strict + Tailwind v4 + Zustand + IndexedDB + @dnd-kit.

---

## Règles d'or

1. **Plan first.** Avant toute modif structurante, invoquer le sub-agent `architect` pour produire un plan écrit que je valide.
2. **TDD sur la logique pure** (`src/lib/`). Sub-agent `tdd` écrit les tests avant l'implémentation.
3. **Pas de `any` TypeScript.** Si un typage est dur, utiliser `unknown` + narrowing. Jamais `any`.
4. **Pas de couleur hexa en dur.** Toute couleur passe par une CSS var (`var(--md-...)`). Voir skill `material-tokens`.
5. **Composants fonctionnels, pas de default export.** Voir skill `react-ts-patterns`.
6. **Un commit = un changement logique cohérent.** Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
7. **Une branche par phase.** `phase-0-fondations`, `phase-1-modele`, etc.

---

## Principes SOLID / DRY appliqués

- **S — Single Responsibility** : un composant qui affiche un bloc ne calcule pas son layout. `BlockTile` consomme des props. `layout.ts` calcule. Séparation stricte.
- **O — Open/Closed** : `CalendarSource` est une interface. Ajouter un provider ne modifie aucun code existant, on ajoute une implémentation.
- **L — Liskov** : toute implémentation de `CalendarSource` respecte le contrat. Tests de contrat côté interface.
- **I — Interface Segregation** : pas d'interfaces gigantesques. `Draggable`, `Resizable`, `Deletable` sont des capacités séparées sur les blocs.
- **D — Dependency Inversion** : les composants dépendent d'abstractions (hooks, store) pas d'implémentations. Le store IndexedDB derrière Zustand est interchangeable.
- **DRY** : toute logique dupliquée 2+ fois part en `lib/` ou hook. Mais **WET > DRY prématuré** : on accepte un peu de duplication tant que l'abstraction n'est pas claire.

---

## Sub-agents disponibles

| Agent | Quand l'invoquer |
|---|---|
| `architect` | Début de phase, avant refactor, décision d'archi |
| `tdd` | Nouvelle fonction dans `lib/`, nouveau endpoint |
| `implementer` | Après que `tdd` a posé les tests |
| `reviewer` | Fin de phase, avant merge, audit |
| `refactor` | Restructuration à comportement constant (tests verts obligatoires avant) |

Voir `.claude/agents/*.md` pour leurs prompts détaillés.

---

## Skills à appliquer systématiquement

- `react-ts-patterns` — conventions code React/TS du projet
- `material-tokens` — tokens CSS autorisés, interdiction couleurs hexa

Voir `.claude/skills/`.

---

## MCPs connectés

- **context7** — doc à jour React 19, Tailwind v4, Zustand, dnd-kit, Zod. Utiliser avant toute utilisation d'API externe pour vérifier la syntaxe actuelle.
- **playwright** — lancer l'app, screenshot, interagir. Utiliser en phase reviewer + E2E.
- **chrome-devtools** — debug live, console, network inspection.

---

## Workflow phase

À chaque phase :

1. `git checkout main && git pull` (si remote)
2. `git checkout -b phase-N-nom`
3. Claude Code : appeler `architect` avec le prompt de phase → produit `PHASE_N_PLAN.md`
4. Utilisateur valide le plan
5. Claude Code : appeler `tdd` sur les modules de logique pure
6. Utilisateur valide les tests
7. Claude Code : appeler `implementer`
8. Tests passent → Claude Code : appeler `reviewer`
9. Fix des findings
10. Commit, merge dans `main`, tag `v0.N`

---

## Interdictions

- **Pas de `console.log` commité.** Utiliser un logger dédié (à faire phase 0).
- **Pas de CSS en `style={}` inline** sauf pour positionnement dynamique (top/left calculés). Sinon → Tailwind.
- **Pas de `useEffect` pour synchroniser un state dérivé.** Utiliser `useMemo` ou état dérivé Zustand.
- **Pas de fetch direct dans les composants.** Toujours via un hook (`useCalendarSync`, etc.) ou une action du store.
- **Pas d'import relatif profond** (`../../../`). Utiliser l'alias `@/` configuré dans `tsconfig` + `vite.config`.

---

## Déclencheurs d'arrêt automatique

Claude Code stoppe et demande validation utilisateur si :

- Il s'apprête à modifier `SPEC.md` ou `CLAUDE.md`
- Il s'apprête à installer une dépendance non listée dans `SPEC.md` section 5
- Il détecte une divergence entre ce qui est demandé et la spec (incohérence)
- Les tests existants cassent après un changement
- Un sub-agent propose une refonte qui dépasse le scope de la phase courante
