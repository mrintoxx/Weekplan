# Daily Block Planner — Spécification v2

Document de référence du projet. Lu par Claude Code et les sub-agents avant toute action.

---

## 1. Vision

Application de planning par blocs. Ne remplace pas Google Calendar (qui garde les RDV, shifts, événements partagés). **Habite le temps entre les événements gcal** avec des blocs issus de templates de journée.

**Flux :**
1. Google Calendar fournit les événements durs (read-only dans l'app)
2. Le type de jour est assigné (manuel ou auto-détecté depuis les events)
3. Le type de jour instancie un **template** sur la date → blocs posés
4. L'utilisateur ajuste : drag, resize (snap 15 min), ajout, suppression

**Utilisateur cible :** TDAH, shifts 12h jour/nuit alternants, nouveau parent, rénovation en cours. Besoin de structure sans friction.

---

## 2. Portée V1 → V6

| Phase | Contenu | Livrable |
|---|---|---|
| 0 | Fondations : stack, tokens, routing, persistance vide | Squelette thémé |
| 1 | Modèle + store + seed | Store interactible, données persistées |
| 2 | Vue semaine read-only | Grille 7j × 24h avec rendu blocs/events |
| 3 | Interactions : drag, resize, CRUD blocs | Édition complète |
| 4 | Templates de jour + popover assignation | Auto-remplissage depuis template |
| 5 | Google Calendar (mock → OAuth réel) | Sync gcal + auto-détection type jour |
| 6 | Polish : PWA, animations, export/import | App utilisable quotidiennement |

**V7+ (parking, hors scope plan actuel) :**
- Supabase cloud free tier pour sync multi-device
- Champ `status` sur instances (réalisé / prévu / zappé)
- Ancres relatives dans templates (ex : "sommeil = fin shift + 1h30")
- Stats hebdo sur ratio planifié / réalisé

---

## 3. Modèle de données

### 3.1 `CalendarEvent` — read-only, venu de gcal

```ts
type CalendarEvent = {
  id: string;              // id gcal
  source: 'gcal';
  calendarId: string;
  title: string;
  start: string;           // ISO datetime
  end: string;             // ISO datetime
  location?: string;
  color?: string;
};
```

Non éditable. Rendu avec bord gauche épais coloré, fond neutre, icône source.

### 3.2 `BlockTemplate` — définition dans un template de jour

```ts
type BlockTemplate = {
  id: string;
  label: string;
  category: BlockCategory;
  start: string;           // HH:MM absolu
  duration: number;        // minutes, multiple de 15
  fixed?: boolean;         // non déplaçable/supprimable une fois instancié
  allowOverlap?: boolean;  // peut chevaucher un autre bloc
  notes?: string;
};
```

**Décision simplificatrice :** pas d'ancres relatives. Tout est en HH:MM absolu. Simple, lisible, suffisant pour du planning pas au millimètre.

### 3.3 `BlockInstance` — bloc posé sur un jour

```ts
type BlockInstance = {
  id: string;
  date: string;            // YYYY-MM-DD du jour principal
  start: string;           // ISO datetime absolu
  end: string;             // ISO datetime (peut être J+1 pour shifts nuit)
  label: string;
  category: BlockCategory;
  sourceTemplateId?: string;
  fixed: boolean;
  notes?: string;
};
```

### 3.4 `DayTemplate`

```ts
type DayTemplate = {
  id: DayType;             // 'off' | 'pre-night' | 'post-night' | 'work' | custom
  label: string;
  description?: string;
  blocks: BlockTemplate[];
  autoDetect?: {
    // Si un event gcal matche, assigne ce type à ce jour
    titlePattern: string;  // regex string
    calendarIds?: string[];
  };
};
```

### 3.5 `WeekPlan` / `DayPlan`

```ts
type WeekPlan = {
  weekStart: string;       // YYYY-MM-DD, toujours lundi ISO
  days: Record<string, DayPlan>;  // clé = YYYY-MM-DD
};

type DayPlan = {
  date: string;
  dayType?: DayType;
  dayTypeManual?: boolean; // true = override manuel, ne pas re-détecter
  instances: BlockInstance[];
  note?: string;
};
```

### 3.6 Catégories

```ts
type BlockCategory =
  | 'sport' | 'reno' | 'bebe' | 'repos'
  | 'perso' | 'travail' | 'transition'
  | 'homelab' | 'famille';
```

Chaque catégorie : couleur token Material, icône lucide, durée par défaut, `allowOverlap` par défaut.

---

## 4. Règles de comportement

### 4.1 Conflit template vs event gcal

Les events gcal sont **immuables**. Quand un template est instancié sur un jour qui contient des events :

1. Pour chaque `BlockTemplate` du template, calculer l'instance prévue (`start`, `end`)
2. Si l'instance chevauche un event gcal :
   - **Rétracter** : la partie qui chevauche est tronquée
   - **Supprimer** : si la durée restante après rétraction < 15 min
3. Les blocs `fixed: true` qui chevauchent → **non posés** + warning loggé

### 4.2 Chevauchement entre blocs

**Max 3 colonnes** sur un même créneau. Au-delà, on refuse l'ajout (toast d'erreur).

Algo simple :
1. Grouper les blocs qui se chevauchent (composantes connexes)
2. Pour chaque groupe, assigner des colonnes 1/2/3 en first-fit
3. Largeur visuelle = `1/nbColonnesDuGroupe`

Events gcal comptent dans le calcul de chevauchement mais occupent toujours la colonne 1.

### 4.3 Ré-application d'un type de jour

Si le jour contient déjà des instances :
- Modal de confirmation : **Écraser tout** / **Garder les ajouts manuels** / **Annuler**
- "Ajout manuel" = instance sans `sourceTemplateId`

### 4.4 Shifts traversant minuit

Stockage : un seul `BlockInstance` avec `start` et `end` ISO. `end` peut tomber sur J+1.

Rendu : split en deux segments visuels reliés (même id, classes CSS `segment-start` / `segment-end`).

### 4.5 Semaine

Lundi → Dimanche (ISO 8601). Pas de verrou sur le passé, édition libre. Pas d'édition rétroactive tracking en V1-V6 (parking pour V7+).

---

## 5. Stack technique

| Brique | Choix | Raison |
|---|---|---|
| Build | Vite | Rapide, standard |
| UI | React 19 + TypeScript strict | Standard projet |
| CSS | Tailwind v4 + CSS vars | Tokens Material 3 injectés en `:root`, consommés par Tailwind |
| Composants | shadcn/ui (à la carte, pas package) | Popover, Dialog, Sheet, Toast |
| State | Zustand + immer | Slices, persistance partielle |
| Drag/Resize | @dnd-kit/core + modifiers | Snap grid, touch support |
| Dates | dayjs + plugins utc, timezone, locale fr | Léger |
| Persist V1-V6 | IndexedDB via idb | Quota, API async |
| Persist V7+ | Supabase cloud free tier | Sync multi-device, Postgres |
| Routing | react-router v7 | Standard |
| Validation | zod | Hydratation store, gcal, imports |
| Icons | lucide-react | Cohérent avec l'écosystème |
| Tests | vitest + @testing-library/react + msw | Unit + intégration + mock réseau |
| Anims | framer-motion | Uniquement phase 6 |

---

## 6. Architecture fichiers

```
src/
  types/           → tous les types de la section 3
  constants/
    categories.ts  → map BlockCategory → config
    templates.ts   → 4 DayTemplate par défaut
    theme.ts       → tokens Material 3
  store/
    useStore.ts
    slices/        → weekPlan, templates, calendar, ui
    persistence.ts → idb wrapper
  lib/
    datetime.ts    → dayjs helpers
    layout.ts      → algo chevauchement 3 colonnes max
    templateEngine.ts → instancie template → instances + résout conflits gcal
    calendarSource.ts → interface + MockCalendarSource + GoogleCalendarSource
  components/
    WeekView/      → WeekGrid, DayColumn, HourRows, NowIndicator, BlockTile, EventTile
    DayTypePopover/
    BlockEditor/   → BlockEditorSheet (bottom sheet mobile, side panel desktop)
    TemplateManager/ → TemplateList, TemplateEditor, BlockLibrary
    common/        → Button, Card, etc. (shadcn customisés)
  hooks/           → useDragBlock, useResizeBlock, useCalendarSync
  App.tsx
  main.tsx
```

---

## 7. Responsive

- **Desktop** (≥ 1024px) : vue semaine 7 colonnes, grille complète
- **Tablet** (640-1023px) : vue semaine 7 colonnes, densité réduite
- **Mobile** (< 640px) : vue jour unique + strip hebdo scrollable en header, bottom sheet pour édition

Breakpoints Tailwind standard. Pas de JS detection, uniquement CSS (`@media` + `container queries`).

---

## 8. Accessibilité

- Contrastes WCAG AA minimum sur tous les tokens
- Navigation clavier complète (tab, arrows dans la grille, escape pour fermer modals)
- ARIA roles : `grid`, `gridcell` sur la semaine
- `prefers-reduced-motion` respecté sur toutes les animations

---

## 9. Tests — stratégie

- **Unit (vitest)** : `datetime`, `layout`, `templateEngine` — couverture > 90%
- **Component (RTL)** : `BlockTile`, `WeekGrid`, `BlockEditorSheet` — cas d'interaction
- **Integration (RTL + msw)** : sync gcal, persistance store
- **E2E (Playwright MCP)** : parcours critiques uniquement, déclenchés manuellement via le sub-agent reviewer

TDD strict sur `lib/` (logique pure). Tests post-impl acceptable sur composants visuels.

---

## 10. Questions ouvertes tranchées

| Question | Réponse |
|---|---|
| Écrasement vs merge lors de ré-application type jour | Modal 3 choix utilisateur |
| Shift nuit : jour J ou J+1 ? | Propriété du jour du `start` |
| Un seul agenda gcal ou plusieurs | Plusieurs, l'utilisateur choisit dans settings |
| Timezone | Stockage UTC, affichage `Europe/Paris`, dayjs avec plugin timezone |

---

## 11. Parking (V7+)

- Backend Supabase cloud free : auth, sync multi-device, row-level security par user
- `status` sur instances : planned / done / skipped / partial, tap long pour changer
- Stats hebdo : ratio par catégorie planifié vs réalisé, tendance
- Ancres relatives templates : `anchor: { from: 'shiftEnd', offset: 90 }`
- Notifications push PWA (suggestion en début de bloc)
- Partage de templates entre utilisateurs
- Vue mois / vue année
- Dark/light auto sur `prefers-color-scheme`

Fin du document.
