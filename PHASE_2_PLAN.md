# Phase 2 — Vue semaine read-only — Plan d'action

## Résumé

Implémenter la vue semaine complète en mode lecture seule : grille 7 colonnes × 24 heures,
rendu des `BlockInstance` via `BlockTile`, rendu des `CalendarEvent` via `EventTile`,
indicateur "maintenant" en temps réel, navigation semaine précédente/suivante, adaptation
responsive (mobile : vue jour + strip hebdo scrollable). Aucune interaction d'édition dans
cette phase (drag, resize, CRUD = phase 3). L'algorithme de layout à colonnes multiples
(`layout.ts`) est créé dans cette phase via TDD.

Livrable : l'utilisateur peut naviguer entre les semaines, voir ses blocs colorés et les
events gcal positionnés sur la grille, sur desktop et mobile.

---

## Questions bloquantes

Aucune.

---

## Découpage en tâches

### T1 — Créer `src/lib/layout.ts` + tests

- **Description** : implémenter l'algorithme de calcul des colonnes (SPEC §4.2). Prend une
  liste d'items `{ id, start, end }`, retourne pour chaque item `{ id, column, totalColumns }`.
  Règles : max 3 colonnes, les events gcal occupent toujours la colonne 1, first-fit sur les
  composantes connexes (blocs qui se chevauchent).
  **Contrat strict** : `layout.ts` travaille exclusivement sur des items aux IDs uniques dans
  la fenêtre d'une seule journée. Il ne connaît pas les blocs traversant minuit — le split est
  fait en amont par l'appelant (T6). Les IDs des segments splittés suivent la convention
  `${originalId}#start` et `${originalId}#end`.
- **Fichiers créés** : `src/lib/layout.ts`, `src/lib/layout.test.ts`
- **Dépendances** : aucune (logique pure)
- **Critère d'acceptation** :
  - Tests couvrent : pas de chevauchement, chevauchement à 2 et 3 colonnes, refus au-delà de
    3 colonnes (throw explicite), events gcal toujours en colonne 1, bords jointifs
    (end == start d'un autre) non considérés comme chevauchement
  - Tous les items en entrée ont des IDs uniques — pas de gestion de split dans ce module
  - Couverture > 90 %
  - Pas de `any`
- **SPEC** : §4.2
- **Sub-agent** : `tdd` (tests), puis `implementer`

---

### T2 — Créer le composant `HourRows`

- **Description** : colonne des labels horaires (00:00 à 23:00) et lignes horizontales de la
  grille. Hauteur fixe par heure (configurable via CSS var). Composant pur, aucune donnée store.
- **Fichiers créés** : `src/components/WeekView/HourRows.tsx`
- **Dépendances** : aucune
- **Critère d'acceptation** :
  - 24 lignes rendues, labels "HH:00" en format 24h (locale fr)
  - Hauteur par heure via `--grid-hour-height` CSS var (valeur par défaut 64px)
  - Couleurs via tokens `var(--md-outline-variant)` uniquement
  - Snapshot test RTL passe
- **SPEC** : §2 (Vue semaine), §6 (architecture)
- **Sub-agent** : `implementer`

---

### T13 — Créer le hook `useCurrentTime`

- **Description** : hook partagé qui retourne la `Date` courante et se met à jour toutes les
  60 secondes. Encapsule `setInterval` + `clearInterval` au unmount. Aucune logique de
  positionnement ni de présentation.
- **Fichiers créés** : `src/hooks/useCurrentTime.ts`
- **Dépendances** : aucune
- **Critère d'acceptation** :
  - Retourne `Date` (pas un string)
  - Intervalle de 60 000 ms, clearInterval garanti au unmount
  - Tests `renderHook` avec fake timers vitest : avancer de 60s → la valeur retournée est mise
    à jour ; avancer de 30s → pas de mise à jour ; démontage → plus aucun tick
  - Pas de `any`
- **SPEC** : §2
- **Sub-agent** : `implementer`

---

### T3 — Créer le composant `NowIndicator`

- **Description** : ligne rouge horizontale positionnée sur l'heure courante. Consomme
  `useCurrentTime()` pour obtenir l'heure — pas de `setInterval` interne. Visible uniquement
  si `isToday` est `true`. Lorsque l'utilisateur navigue entre semaines, `DayColumn` transmet
  `isToday` recalculé : l'indicateur réapparaît instantanément sur le bon jour sans attendre
  le tick du hook.
- **Fichiers créés** : `src/components/WeekView/NowIndicator.tsx`
- **Dépendances** : T13 (`useCurrentTime`)
- **Critère d'acceptation** :
  - Position calculée depuis `HOUR_HEIGHT_PX` : `top = (h * 60 + m) * HOUR_HEIGHT_PX / 60` px
  - `style={{ top }}` (valeur dynamique, inline autorisé)
  - Couleur via `var(--md-error)`
  - `role="presentation"` sur l'élément racine
  - Test RTL : rendu quand `isToday=true`, null quand `isToday=false`
  - `prefers-reduced-motion` : pas d'animation (statique suffisant)
- **SPEC** : §2 (Grille 7j × 24h), §8 (accessibilité)
- **Sub-agent** : `implementer`

---

### T4 — Créer le composant `BlockTile`

- **Description** : tuile visuelle pour un `BlockInstance`. Reçoit les props calculées par le
  parent (top, height, left%, width%). Affiche label, icône de catégorie (lucide), couleur de
  fond via le token de catégorie. Rendu split possible pour blocs traversant minuit.
- **Fichiers créés** : `src/components/WeekView/BlockTile.tsx`
- **Dépendances** : T1 (types de layout), `src/constants/categories.ts`
- **Critère d'acceptation** :
  - Props : `instance: BlockInstance`, `top: number`, `height: number`, `leftPercent: number`,
    `widthPercent: number`, `segment?: 'start' | 'end' | 'single'`
  - Fond : `background-color: var(--cat-{category})`  via style inline (valeur dynamique)
  - Icône : composant Lucide dont le nom vient de `CATEGORY_CONFIG[category].icon`
  - Label tronqué si hauteur < 30px (classe CSS conditionnelle)
  - `data-testid="block-tile"` présent
  - Test RTL : rendu avec les bonnes classes selon `segment`
  - Pas de `any`
- **SPEC** : §3.3, §4.4, §6
- **Sub-agent** : `implementer`

---

### T5 — Créer le composant `EventTile`

- **Description** : tuile visuelle pour un `CalendarEvent`. Bord gauche épais coloré
  (`color` de l'event ou fallback token), fond neutre, icône source gcal, label + horaire.
  Toujours en colonne 1 (conforme layout).
- **Fichiers créés** : `src/components/WeekView/EventTile.tsx`
- **Dépendances** : T1 (types de layout)
- **Critère d'acceptation** :
  - Props : `event: CalendarEvent`, `top: number`, `height: number`, `leftPercent: number`,
    `widthPercent: number`
  - Bord gauche : couleur via une CSS custom property locale assignée en style inline :
    `style={{ '--event-accent': event.color ?? 'var(--md-primary)' } as React.CSSProperties}`.
    La règle CSS/Tailwind utilise `border-left-color: var(--event-accent)`. Aucune couleur
    en dur dans `style={}` — uniquement l'assignation de la variable. Pattern cohérent avec
    CLAUDE.md : `style={}` réservé aux valeurs dynamiques, jamais au styling statique.
  - Fond : `var(--md-surface-container-high)`
  - `data-testid="event-tile"` présent
  - Test RTL basique
- **SPEC** : §3.1, §4.2
- **Sub-agent** : `implementer`

---

### T6 — Créer le hook `useLayoutForDay`

- **Description** : hook qui orchestre le pipeline split → layout pour un jour donné.
  Étapes dans l'ordre :
  1. Pour chaque `BlockInstance`, appelle `splitInstanceForDay(instance, date)` (de
     `datetime.ts`) qui retourne 1 ou 2 segments avec IDs `${id}#start` / `${id}#end`
     (ou `${id}#single`).
  2. Pour chaque `CalendarEvent`, appelle `splitAtMidnight(event.start, event.end)` et
     génère des items avec IDs `${event.id}#start` / `${event.id}#end` / `${event.id}#single`
     et flag `isEvent: true` pour forcer la colonne 1.
  3. Passe tous les items à `computeLayout` de `layout.ts`.
  4. Retourne la map `originalId → { top, height, leftPercent, widthPercent, segment }`.
  Le split est **toujours fait ici**, jamais dans `layout.ts`.
- **Fichiers créés** : `src/hooks/useLayoutForDay.ts`
- **Dépendances** : T1 (layout.ts), `splitInstanceForDay` dans datetime.ts
- **Critère d'acceptation** :
  - Retourne un objet stable (mémoïsé via `useMemo`) pour éviter re-renders
  - `HOUR_HEIGHT_PX = 64` (depuis `@/constants/grid`) utilisé pour calculer top/height en px
  - Tests `renderHook` couvrent : 0 blocs, 1 bloc simple, bloc traversant minuit
    (vérifie que 2 entrées segment-start/end sont dans le résultat), chevauchement 2 blocs
- **SPEC** : §4.2, §4.4
- **Sub-agent** : `tdd` (tests hook), puis `implementer`

---

### T7 — Créer le composant `DayColumn`

- **Description** : colonne d'un jour dans la grille. Reçoit date, liste de blocs et d'events.
  Appelle `useLayoutForDay`, rend `BlockTile` et `EventTile` positionnés en absolu, plus
  `NowIndicator` si le jour est aujourd'hui.
- **Fichiers créés** : `src/components/WeekView/DayColumn.tsx`
- **Dépendances** : T2, T3, T4, T5, T6
- **Critère d'acceptation** :
  - Props : `date: string`, `instances: BlockInstance[]`, `events: CalendarEvent[]`,
    `isToday: boolean`
  - Conteneur `role="gridcell"` avec `aria-label="Jour {date formaté fr}"`
  - `data-testid="day-column-{YYYY-MM-DD}"`
  - Test RTL : avec seed de 2 blocs et 1 event, vérifie que `BlockTile` × 2 et `EventTile` × 1
    sont dans le DOM
- **SPEC** : §3, §4.2, §8
- **Sub-agent** : `implementer`

---

### T8 — Créer le composant `WeekGrid`

- **Description** : assemblage de la grille complète. Rend `HourRows` + 7 `DayColumn` côte à
  côte. Lit `selectedWeekStart` dans le store, récupère `WeekPlan` et `CalendarEvent` pour la
  semaine sélectionnée. Header avec labels "Lun 14", "Mar 15"…
- **Fichiers créés** : `src/components/WeekView/WeekGrid.tsx`
- **Dépendances** : T2, T7
- **Critère d'acceptation** :
  - `role="grid"` sur l'élément racine de la grille
  - Header : 7 colonnes avec jour abrégé + numéro, `aria-label` correct
  - Grille scrollable verticalement, sticky header + sticky colonne horaire
  - Test RTL : avec store mocké (1 semaine, 2 jours avec blocs), vérifie que 7 colonnes sont
    rendues et que les tuiles des jours concernés apparaissent
- **SPEC** : §2, §7, §8
- **Sub-agent** : `implementer`

---

### T9 — Créer le composant `WeekNavBar`

- **Description** : barre de navigation semaine. Boutons "< Semaine précédente" et "Semaine
  suivante >", label de la semaine courante "14 – 20 avril 2026", bouton "Aujourd'hui".
  Appelle `setSelectedWeekStart` du store.
- **Fichiers créés** : `src/components/WeekView/WeekNavBar.tsx`
- **Dépendances** : `useStore` (uiSlice), `dayjs`
- **Critère d'acceptation** :
  - Clic "Précédente" soustrait 7 jours au `selectedWeekStart`
  - Clic "Suivante" ajoute 7 jours
  - Clic "Aujourd'hui" remet `selectedWeekStart` au lundi de la semaine courante
  - Test RTL : 3 boutons rendus, clic "Suivante" change le store
  - Icônes `ChevronLeft` / `ChevronRight` lucide
- **SPEC** : §4.5
- **Sub-agent** : `implementer`

---

### T10 — Vue mobile : `DayStrip` + vue jour unique

- **Description** : sur mobile (< 640px), la vue semaine est remplacée par un strip horizontal
  scrollable de 7 pastilles de jours en header, et la colonne du jour sélectionné occupe tout
  l'écran en dessous.
- **Fichiers créés** : `src/components/WeekView/DayStrip.tsx`
- **Modifications** : `src/components/WeekView/WeekGrid.tsx` (ajout responsive)
- **Dépendances** : T7, T8, T9
- **Critère d'acceptation** :
  - `DayStrip` : 7 pastilles cliquables, pastille du jour sélectionné `selectedDate` surlignée
    via `var(--md-primary)`
  - Clic pastille : appelle `setSelectedDate` du store
  - Sur mobile, seul le `DayColumn` du `selectedDate` est rendu (les 6 autres sont masqués CSS)
  - Responsive via classes Tailwind `hidden sm:block` / `block sm:hidden` — pas de JS detection
  - Test RTL : snapshot du strip avec 7 éléments
- **SPEC** : §7
- **Sub-agent** : `implementer`

---

### T11 — Assembler la vue et brancher dans `App.tsx`

- **Description** : créer `src/components/WeekView/index.ts` (barrel), mettre à jour `App.tsx`
  pour rendre `WeekNavBar` + `WeekGrid`, appeler `initializeStore()` au montage via `useEffect`
  dans `main.tsx` (déjà prévu) ou dans `App.tsx`.
- **Fichiers modifiés** : `src/App.tsx`, `src/main.tsx`
- **Fichiers créés** : `src/components/WeekView/index.ts`
- **Dépendances** : T8, T9, T10
- **Critère d'acceptation** :
  - L'application démarre, la grille semaine s'affiche avec les données seed de phase 1
  - `initializeStore` est appelée une seule fois (pas dans une boucle de rendu)
  - Pas de `console.log` dans le code commité
  - Test smoke RTL sur `App.tsx` : rendu sans erreur
- **SPEC** : §6
- **Sub-agent** : `implementer`

---

### T12 — Constante partagée `HOUR_HEIGHT_PX` et barrel exports

- **Description** : exporter `HOUR_HEIGHT_PX = 64` depuis un fichier de constantes partagé
  consommé par `HourRows`, `useLayoutForDay` et tout composant qui positionne des éléments
  sur la grille. Garantit une seule source de vérité.
- **Fichiers créés** : `src/constants/grid.ts`
- **Dépendances** : aucune (peut être faite en premier ou en parallèle de T2)
- **Critère d'acceptation** :
  - `HOUR_HEIGHT_PX` est de type `number` et exporté nominativement
  - Tous les composants qui positionnent sur la grille l'importent depuis `@/constants/grid`
  - Pas de valeur `64` hexa-codée ailleurs dans les composants de grille
- **SPEC** : §6 (architecture)
- **Sub-agent** : `implementer`

---

## Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Blocs traversant minuit mal positionnés dans la grille | Affichage cassé | `splitAtMidnight` déjà testé en phase 1 ; T6 teste explicitement ce cas dans `useLayoutForDay` |
| Performance sur re-renders de la grille (240+ cellules) | UI saccadée | `useMemo` dans `useLayoutForDay`, memo sur `DayColumn` si nécessaire |
| Sticky header + sticky colonne horaire difficiles en CSS pur | Layout cassé sur certains navigateurs | Utiliser `position: sticky` avec `overflow` bien configuré ; valider avec Playwright MCP en phase reviewer |
| Accessibilité `role="grid"` avec `gridcell` incompatible avec `overflow: auto` | Screen reader confus | Tester avec axe-core en phase reviewer ; fallback `role="region"` si conflit |
| Lucide icons import dynamique selon `CATEGORY_CONFIG[icon]` | Erreur de build si le nom n'est pas exporté | T4 teste le rendu de chaque catégorie ; si import dynamique n'est pas possible, utiliser une map statique `iconName → LucideIcon` |

---

## Tests à prévoir

| Tâche | Fichier de test | Nature | Contenu clé |
|---|---|---|---|
| T1 | `src/lib/layout.test.ts` | unit (vitest) | Aucun bloc, 2 blocs qui se chevauchent, 3 colonnes max, throw à 4+, events en col 1, bords jointifs non-chevauchants |
| T2 | `src/components/WeekView/HourRows.test.tsx` | component (RTL) | Snapshot, 24 labels rendus |
| T13 | `src/hooks/useCurrentTime.test.ts` | unit (renderHook) | Fake timers : tick 60s → update, 30s → pas update, unmount → no tick |
| T3 | `src/components/WeekView/NowIndicator.test.tsx` | component (RTL) | Rendu/non-rendu selon `isToday`, style top en px |
| T4 | `src/components/WeekView/BlockTile.test.tsx` | component (RTL) | Props complètes, classes segment, label tronqué, data-testid |
| T5 | `src/components/WeekView/EventTile.test.tsx` | component (RTL) | Bord coloré, fond neutre, data-testid |
| T6 | `src/hooks/useLayoutForDay.test.ts` | unit (renderHook) | 0 blocs, 1 bloc, chevauchement 2 blocs, bloc traversant minuit |
| T7 | `src/components/WeekView/DayColumn.test.tsx` | component (RTL) | Blocs + events présents, NowIndicator conditionnel, role gridcell |
| T8 | `src/components/WeekView/WeekGrid.test.tsx` | component (RTL) | 7 colonnes rendues, blocs dans le bon jour |
| T9 | `src/components/WeekView/WeekNavBar.test.tsx` | component (RTL) | Navigation avant/arrière/aujourd'hui change le store |
| T10 | `src/components/WeekView/DayStrip.test.tsx` | component (RTL) | 7 pastilles, sélection change |
| T11 | `src/App.test.tsx` | component (RTL) | Smoke test, pas d'erreur, grille présente |

---

## Checklist de fin de phase

- [ ] Tous les critères d'acceptation des tâches T1–T13 validés
- [ ] `src/lib/layout.ts` couverture > 90 %
- [ ] Tous les tests vitest verts (`npm test`)
- [ ] Aucun `console.log` dans le code commité
- [ ] Aucune couleur hexa en dur dans les composants
- [ ] Aucun `any` TypeScript
- [ ] Vue semaine affiche correctement les données seed sur desktop
- [ ] Vue mobile : strip + jour unique fonctionnels
- [ ] NowIndicator visible sur la semaine courante
- [ ] Navigation semaine fonctionne (précédente / suivante / aujourd'hui)
- [ ] Review sub-agent `reviewer` passée
- [ ] SPEC.md à jour si divergence constatée
- [ ] Commit conventionnel + tag `v0.2`

---

## Parking (hors scope phase 2)

- Drag & drop des blocs (phase 3)
- Resize des blocs (phase 3)
- CRUD blocs via BlockEditorSheet (phase 3)
- Popover assignation type de jour (phase 4)
- Toast erreur "max 3 colonnes" (phase 3, lors de l'ajout de blocs)
- Animations d'entrée sur les tuiles (phase 6, framer-motion)
- Dark/light toggle (parking V7+)
