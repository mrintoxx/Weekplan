# Phase 1 — Modèle + store + seed — Plan d'action

## Résumé

Objectif : poser toutes les fondations de données de l'application sans toucher à l'UI. À l'issue de cette phase, un store Zustand complet est hydraté depuis IndexedDB avec des données seed (4 DayTemplate + 2 semaines de mock CalendarEvent). Le store est accessible via `window.__store__` dans la console navigateur. L'assignation d'un type de jour déclenche l'instanciation du template correspondant avec résolution des conflits gcal. Aucun composant React n'est créé. Le livrable se vérifie uniquement par la console navigateur et les tests vitest.

**Principe structurant (correction v2) :** les schémas Zod (`src/lib/schemas.ts`) sont la **source de vérité unique**. Les types TypeScript sont inférés via `z.infer<typeof schema>`. Pas de duplication type/schema.

---

## Questions bloquantes

Aucune. Les ambiguïtés identifiées ci-dessous ont des réponses tranchées dans SPEC.md ou sont des choix d'implémentation sans impact sur le comportement observable.

---

## Découpage en tâches

### Groupe A — Schémas & Types

---

#### T1.01 — Schémas Zod `src/lib/schemas.ts` (source de vérité)

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/lib/schemas.ts` (création)
- **Dépendances** : aucune
- **Critères d'acceptation** :
  - [ ] `blockCategorySchema` : `z.enum(['sport', 'reno', 'bebe', 'repos', 'perso', 'travail', 'transition', 'homelab', 'famille'])`
  - [ ] `dayTypeSchema` : `z.union([z.enum(['off', 'pre-night', 'post-night', 'work']), z.string()])`
  - [ ] `calendarEventSchema` : conforme à SPEC.md 3.1 — `source: z.literal('gcal')`, tous les champs y compris optionnels
  - [ ] `blockTemplateSchema` : conforme à SPEC.md 3.2 — `start` validé format HH:MM via `z.string().regex(/^\d{2}:\d{2}$/)`, `duration` validé multiple de 15 via `.refine(n => n % 15 === 0)`
  - [ ] `blockInstanceSchema` : conforme à SPEC.md 3.3 — `start` et `end` en ISO datetime
  - [ ] `dayTemplateSchema` : conforme à SPEC.md 3.4
  - [ ] `weekPlanSchema` : conforme à SPEC.md 3.5
  - [ ] `dayPlanSchema` : conforme à SPEC.md 3.5
  - [ ] Helper exporté : `safeParseWith<T>(schema: ZodType<T>, data: unknown): T | null` — utilise `safeParse`, retourne `null` sur erreur
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : sections 3.1 à 3.6
- **Tests à prévoir** : tests unitaires sur `safeParseWith` avec données valides et corrompues, écrits par implementer après l'implémentation

---

#### T1.02 — Types inférés `src/types/` + barrel `index.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/types/block.ts` (création)
  - `src/types/calendar.ts` (création)
  - `src/types/plan.ts` (création)
  - `src/types/index.ts` (création)
- **Dépendances** : T1.01
- **Critères d'acceptation** :
  - [ ] `block.ts` : `export type BlockCategory = z.infer<typeof blockCategorySchema>`, `export type DayType = z.infer<typeof dayTypeSchema>`, `export type BlockTemplate = z.infer<typeof blockTemplateSchema>`, `export type BlockInstance = z.infer<typeof blockInstanceSchema>`
  - [ ] `calendar.ts` : `export type CalendarEvent = z.infer<typeof calendarEventSchema>`
  - [ ] `plan.ts` : `export type DayTemplate = z.infer<typeof dayTemplateSchema>`, `export type WeekPlan = z.infer<typeof weekPlanSchema>`, `export type DayPlan = z.infer<typeof dayPlanSchema>`
  - [ ] `index.ts` re-exporte tous les types des 3 fichiers
  - [ ] Pas de redéfinition manuelle de type — chaque type est exclusivement `z.infer<...>`
  - [ ] Pas de `any`, pas de `default export`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : sections 3.1 à 3.6
- **Tests à prévoir** : aucun (types purs, validés par le compilateur)

---

### Groupe B — Constantes

---

#### T1.03 — Constante `categories.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/constants/categories.ts` (création)
- **Dépendances** : T1.02
- **Critères d'acceptation** :
  - [ ] Type local `CategoryConfig = { label: string; colorToken: string; icon: string; defaultDuration: number; allowOverlap: boolean }` exporté nommé
  - [ ] Export nommé `CATEGORY_CONFIG: Record<BlockCategory, CategoryConfig>` pour les 9 catégories
  - [ ] Toutes les valeurs `colorToken` sont de la forme `--cat-<nom>` (ex: `--cat-sport`). Aucune valeur hexa ou HSL en dur
  - [ ] `icon` = nom de composant lucide-react valide (string, pas d'import du composant ici)
  - [ ] `defaultDuration` est un multiple de 15 pour chaque catégorie
  - [ ] Le compilateur garantit l'exhaustivité de l'union `BlockCategory`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : section 3.6, skill material-tokens
- **Tests à prévoir** : aucun

---

#### T1.04 — Constante `templates.ts` — template OFF et PRE-NIGHT

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/constants/templates.ts` (création)
- **Dépendances** : T1.02, T1.03
- **Critères d'acceptation** :
  - [ ] Template **OFF** (label: 'Jour off') — blocs dans l'ordre chronologique :
    - `off-lever` : label 'Lever', perso, 07:00, 30min
    - `off-sport` : label 'Sport', sport, 07:30, 90min
    - `off-reno-1` : label 'Réno bloc 1', reno, 09:30, 210min
    - `off-dejeuner` : label 'Déjeuner', famille, 13:00, 45min
    - `off-reno-2` : label 'Réno bloc 2', reno, 15:15, 135min
    - `off-famille` : label 'Famille', famille, 17:30, 210min
    - `off-homelab` : label 'Homelab', homelab, 21:00, 60min
    - `off-coucher` : label 'Coucher', repos, 22:00, 15min, fixed: true
  - [ ] Template **PRE-NIGHT** (label: 'Pré-nuit') — blocs dans l'ordre chronologique :
    - `pre-night-lever` : label 'Lever', perso, 09:00, 30min
    - `pre-night-perso` : label 'Perso', perso, 09:30, 90min
    - `pre-night-sport-reno` : label 'Sport ou Réno', sport, 11:00, 150min, notes: 'sport OU réno au choix'
    - `pre-night-dejeuner` : label 'Déjeuner', famille, 13:30, 45min
    - `pre-night-transition` : label 'Transition', transition, 15:00, 120min
    - `pre-night-repas` : label 'Repas', famille, 17:00, 60min
    - `pre-night-depart` : label 'Départ shift', transition, 18:30, 30min, fixed: true
    - `pre-night-shift-nuit` : label 'Shift nuit', travail, 19:00, 720min, fixed: true (traverse minuit → fin 07:00 J+1)
  - [ ] Chaque `BlockTemplate` a un `id` unique stable (format `<daytype>-<slug>`)
  - [ ] Toutes les durées sont des multiples de 15
  - [ ] Export nommé `DEFAULT_DAY_TEMPLATES: DayTemplate[]` initialisé avec les 2 premiers templates
  - [ ] `autoDetect.titlePattern` renseigné pour `pre-night` : regex case-insensitive matchant 'nuit'
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : section 3.4
- **Tests à prévoir** : aucun

---

#### T1.05 — Constante `templates.ts` — template POST-NIGHT et WORK

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/constants/templates.ts` (modification)
- **Dépendances** : T1.04
- **Critères d'acceptation** :
  - [ ] Template **POST-NIGHT** (label: 'Post-nuit') — blocs dans l'ordre chronologique :
    - `post-night-retour` : label 'Retour', transition, 07:00, 30min, fixed: true
    - `post-night-manger` : label 'Manger', famille, 08:00, 30min
    - `post-night-sommeil` : label 'Sommeil', repos, 08:30, 330min, fixed: true (fin 14:00)
    - `post-night-reveil` : label 'Réveil progressif', perso, 14:00, 105min
    - `post-night-taches` : label 'Tâches légères', perso, 15:45, 75min
    - `post-night-famille` : label 'Famille', famille, 17:00, 240min
    - `post-night-coucher` : label 'Coucher', repos, 21:00, 15min, fixed: true
  - [ ] Template **WORK** (label: 'Travail') — blocs dans l'ordre chronologique :
    - `work-lever` : label 'Lever', perso, 04:00, 30min, fixed: true
    - `work-perso` : label 'Perso', perso, 04:30, 75min
    - `work-depart` : label 'Départ shift', transition, 05:45, 75min, fixed: true
    - `work-shift-jour` : label 'Shift jour', travail, 07:00, 720min, fixed: true (fin 19:00)
    - `work-retour` : label 'Retour', transition, 19:00, 60min, fixed: true
    - `work-famille` : label 'Famille', famille, 20:00, 90min
    - `work-coucher` : label 'Coucher', repos, 21:30, 15min, fixed: true
  - [ ] `autoDetect.titlePattern` renseigné pour `work` : regex case-insensitive matchant 'jour'
  - [ ] `DEFAULT_DAY_TEMPLATES` inclut les 4 templates (off, pre-night, post-night, work)
  - [ ] Toutes les durées sont des multiples de 15
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : section 3.4
- **Tests à prévoir** : aucun

---

### Groupe C — Lib logique pure (TDD)

---

#### T1.06 — Tests `datetime.ts` (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/lib/datetime.test.ts` (création)
- **Dépendances** : T1.02
- **Critères d'acceptation** :
  - [ ] Tests rouges écrits pour `formatISODate`, `parseISODate`, `weekStartOf`, `addMinutes`, `toAbsoluteISO`, `splitAtMidnight`
  - [ ] `weekStartOf` testé pour des dates milieu de semaine, lundi, dimanche
  - [ ] `splitAtMidnight` testé : bloc dans la même journée → segment 'single' ; bloc traversant minuit → segments 'start' + 'end' ; bloc démarrant exactement à minuit
  - [ ] `addMinutes` testé sur passage de jour (23:30 + 60min → J+1 00:30)
  - [ ] `toAbsoluteISO` testé : combine YYYY-MM-DD + HH:MM → ISO datetime en timezone Europe/Paris
  - [ ] Setup vitest contient `process.env.TZ = 'Europe/Paris'` pour stabiliser les tests de timezone
  - [ ] Les tests utilisent vitest (`describe`, `it`, `expect`) sans import de l'implémentation (fichier inexistant à ce stade)
  - [ ] `npm test -- --run` signale les fichiers en échec correctement (rouge attendu)
- **Réf SPEC.md** : section 10 (timezone Europe/Paris)
- **Tests** : unit, couverture > 90% des branches de chaque helper

---

#### T1.07 — Implémentation `datetime.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/lib/datetime.ts` (création)
- **Dépendances** : T1.06
- **Critères d'acceptation** :
  - [ ] dayjs configuré avec plugins utc, timezone, locale fr (imports explicites)
  - [ ] Toutes les signatures de fonctions correspondent aux tests de T1.06
  - [ ] `formatISODate(date: Dayjs): string` → YYYY-MM-DD
  - [ ] `parseISODate(s: string): Dayjs` → timezone Paris
  - [ ] `weekStartOf(date: Dayjs): Dayjs` → lundi ISO de la semaine contenant la date
  - [ ] `addMinutes(isoDatetime: string, minutes: number): string` → ISO string
  - [ ] `toAbsoluteISO(date: string, time: string): string` → combine YYYY-MM-DD + HH:MM → ISO datetime Paris
  - [ ] `splitAtMidnight(start: string, end: string): Array<{ start: string; end: string; segment: 'start' | 'end' | 'single' }>`
  - [ ] Aucun `any`
  - [ ] Tous les tests T1.06 passent au vert
- **Réf SPEC.md** : sections 3.3, 3.5, 4.4, 10

---

#### T1.08 — Tests `calendarSource.ts` (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/lib/calendarSource.test.ts` (création)
- **Dépendances** : T1.02, T1.07
- **Critères d'acceptation** :
  - [ ] Test de contrat : `MockCalendarSource` implémente `CalendarSource` (typage vérifié)
  - [ ] `fetchEvents(from, to)` retourne une `Promise<CalendarEvent[]>` non vide pour une plage de 14 jours centrée sur today
  - [ ] Les events générés ont `source === 'gcal'`
  - [ ] Les events ont `calendarId === 'mock-work'`
  - [ ] Les events alternent **sans gap** : Shift Jour (07:00→19:00) suivi de Shift Nuit (19:00→07:00 J+1) en alternance sur 14 jours
  - [ ] Les shifts Nuit ont `end` sur J+1 par rapport à leur `start` (ex: start 2026-04-21T19:00, end 2026-04-22T07:00)
  - [ ] `fetchEvents` avec une plage vide retourne `[]`
  - [ ] Aucun gap de 2h ou plus entre shifts consécutifs — le Shift Nuit commence exactement quand le Shift Jour se termine (19:00)
- **Réf SPEC.md** : sections 3.1, 4.4
- **Tests** : unit + tests de contrat d'interface

---

#### T1.09 — Implémentation `calendarSource.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/lib/calendarSource.ts` (création)
- **Dépendances** : T1.08
- **Critères d'acceptation** :
  - [ ] `interface CalendarSource { fetchEvents(from: string, to: string): Promise<CalendarEvent[]> }` exportée
  - [ ] `MockCalendarSource implements CalendarSource` : génère shifts alternants sur la plage demandée
    - Shift Jour : 07:00→19:00 (title: 'Shift Jour')
    - Shift Nuit : 19:00→07:00 J+1 (title: 'Shift Nuit') — pas de gap, début immédiat après le Shift Jour
    - Alternance cohérente jour après jour (Jour J = Shift Jour, Jour J+1 = nuit de J, etc.)
  - [ ] Chaque event a un `id` unique (ex: `mock-<date>-jour`, `mock-<date>-nuit`)
  - [ ] Pas de `any`
  - [ ] Tous les tests T1.08 passent au vert
- **Réf SPEC.md** : section 3.1, principe O/L (CLAUDE.md)

---

#### T1.10 — Tests `templateEngine.ts` — cas nominaux (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/lib/templateEngine.test.ts` (création)
- **Dépendances** : T1.02, T1.04, T1.05, T1.07
- **Critères d'acceptation** :
  - [ ] Test : template OFF sur un jour sans events → retourne 8 instances (autant que de blocs)
  - [ ] Test : chaque instance a `sourceTemplateId` renseigné correspondant au `id` du BlockTemplate
  - [ ] Test : les `start` et `end` des instances sont des strings ISO valides en timezone Paris
  - [ ] Test : le bloc `off-sport` (07:30, 90min) a `end` correspondant à 09:00 ISO
  - [ ] Test : template pre-night → `pre-night-shift-nuit` (19:00, 720min) a `end` sur J+1 à 07:00 ISO
  - [ ] Test : chaque instance a un `id` unique (aucun doublon sur la liste retournée)
  - [ ] Test : `idGenerator` optionnel passé en paramètre produit des IDs déterministes (ex: compteur)
- **Réf SPEC.md** : section 4.1
- **Tests** : unit

---

#### T1.11 — Tests `templateEngine.ts` — résolution conflits gcal (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/lib/templateEngine.test.ts` (modification)
- **Dépendances** : T1.10
- **Critères d'acceptation** :
  - [ ] Test : un bloc normal chevauche partiellement un event gcal → le bloc est rétracté (son `end` = `start` de l'event)
  - [ ] Test : après rétraction, durée restante ≥ 15 min → bloc conservé avec la durée réduite
  - [ ] Test : après rétraction, durée restante < 15 min → bloc absent du résultat
  - [ ] Test : bloc `fixed: true` qui chevauche un event → absent du résultat
  - [ ] Test : bloc `fixed: true` sans chevauchement → inclus normalement
  - [ ] Test : event gcal entièrement contenu dans un bloc → bloc tronqué sur le bord gauche uniquement (end = start de l'event), résidu < 15 min → supprimé
  - [ ] Test : bloc `allowOverlap: true` → ignoré dans le calcul de conflit, posé tel quel même si chevauchement
- **Réf SPEC.md** : section 4.1 règles 1 à 5
- **Tests** : unit

---

#### T1.12 — Implémentation `templateEngine.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/lib/templateEngine.ts` (création)
- **Dépendances** : T1.11
- **Critères d'acceptation** :
  - [ ] Signature : `function instantiateTemplate(template: DayTemplate, date: string, events: CalendarEvent[], idGenerator?: () => string): BlockInstance[]`
  - [ ] `idGenerator` par défaut : `crypto.randomUUID()`
  - [ ] Implémentation des 5 règles SPEC.md 4.1 dans l'ordre exact
  - [ ] La rétraction tronque sur le bord gauche : `end` de l'instance = `start` du premier event conflictuel chronologiquement
  - [ ] Blocs `fixed: true` chevauchant un event → non posés, warning via `logger`
  - [ ] Pas de `any`
  - [ ] Tous les tests T1.10 et T1.11 passent au vert
- **Réf SPEC.md** : section 4.1

---

### Groupe D — Persistance IDB

---

#### T1.13 — `persistence.ts` — ouverture DB et migrations

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/persistence.ts` (création)
- **Dépendances** : T1.01
- **Critères d'acceptation** :
  - [ ] `openDB()` ouvre `weekplan-db` version 1 via la lib `idb`
  - [ ] Object stores créés : `weekPlans` (keyPath: `weekStart`), `templates` (keyPath: `id`)
  - [ ] Upgrade callback structuré pour faciliter les migrations futures (commentaire explicite "version 1 → 2")
  - [ ] La fonction est exportée nommée, retourne `Promise<IDBPDatabase>`
  - [ ] Pas de `any`
- **Réf SPEC.md** : section 5 (IndexedDB via idb)
- **Tests à prévoir** : aucun test unitaire direct (IDB en jsdom nécessite un mock complexe — testé indirectement via les tests d'intégration du store)

---

#### T1.14 — `persistence.ts` — fonctions CRUD WeekPlan et Templates

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/persistence.ts` (modification)
- **Dépendances** : T1.13
- **Critères d'acceptation** :
  - [ ] `getWeekPlan(weekStart: string): Promise<WeekPlan | undefined>`
  - [ ] `saveWeekPlan(plan: WeekPlan): Promise<void>`
  - [ ] `getAllTemplates(): Promise<DayTemplate[]>`
  - [ ] `saveTemplate(t: DayTemplate): Promise<void>`
  - [ ] `deleteTemplate(id: string): Promise<void>`
  - [ ] Chaque fonction appelle `openDB()` — pas de singleton DB au niveau module (la lib idb gère le pool de connexions)
  - [ ] Pas de `any`
- **Réf SPEC.md** : section 5
- **Tests à prévoir** : aucun test unitaire direct (voir T1.13)

---

### Groupe E — Store Zustand

---

#### T1.15 — Tests `weekPlanSlice` — lecture et mutations simples (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/store/slices/weekPlanSlice.test.ts` (création)
- **Dépendances** : T1.02, T1.07, T1.12
- **Critères d'acceptation** :
  - [ ] Setup : créer un store de test isolé (zustand `create()` standalone, pas le store global)
  - [ ] `persistence.ts` mocké via `vi.mock('@/store/persistence')`
  - [ ] Test `getWeekPlan` : retourne `undefined` si la semaine n'existe pas
  - [ ] Test `upsertDayPlan` : insère un DayPlan dans une semaine existante
  - [ ] Test `upsertDayPlan` : crée la WeekPlan si elle n'existe pas encore
  - [ ] Test `addBlockInstance` : ajoute une instance dans le DayPlan correspondant
  - [ ] Test `updateBlockInstance` : modifie une instance existante par son id
  - [ ] Test `removeBlockInstance` : supprime une instance existante par son id
  - [ ] Test `setDayNote` : met à jour le champ `note` du DayPlan
  - [ ] Tests organisés en `describe('weekPlanSlice', () => { ... })`
- **Réf SPEC.md** : section 3.5
- **Tests** : unit sur la logique du slice (sans IDB réel)

---

#### T1.16 — Tests `weekPlanSlice` — assignation type de jour (agent tdd)

- **Responsable** : tdd
- **Fichiers impactés** :
  - `src/store/slices/weekPlanSlice.test.ts` (modification)
- **Dépendances** : T1.15
- **Critères d'acceptation** :
  - [ ] Test `assignDayType` : assigne `dayType` au DayPlan, déclenche `instantiateTemplate`, peuple `instances`
  - [ ] Test : les instances résultantes ont `sourceTemplateId` renseigné
  - [ ] Test : `dayTypeManual` n'est pas positionné à `true` lors d'une assignation programmatique simple (modal parking Phase 4)
  - [ ] Test `assignDayType` avec events mock en store → les conflits sont résolus (un event qui chevauche rétracte le bloc)
  - [ ] Test : si le template demandé n'existe pas dans le store → warning loggé via `logger`, `instances` reste vide
- **Réf SPEC.md** : sections 4.1, 4.3 (modal parking Phase 4)
- **Tests** : unit

---

#### T1.17 — Implémentation `weekPlanSlice.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/slices/weekPlanSlice.ts` (création)
- **Dépendances** : T1.16, T1.12, T1.14
- **Critères d'acceptation** :
  - [ ] Slice Zustand + immer : toutes les actions mutent via `produce` immer (pas de spread manuel)
  - [ ] `assignDayType` appelle `instantiateTemplate` en récupérant le template depuis le store templates et les events depuis le store calendar
  - [ ] Write-through sur toutes les mutations : chaque action appelle `saveWeekPlan` après la mutation immer
  - [ ] Logger utilisé (pas de `console.log`) pour les warnings (template introuvable, bloc fixed supprimé)
  - [ ] Pas de `any`
  - [ ] Tous les tests T1.15 et T1.16 passent au vert
- **Réf SPEC.md** : sections 3.5, 4.1, 4.3

---

#### T1.18 — Implémentation `templatesSlice.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/slices/templatesSlice.ts` (création)
- **Dépendances** : T1.02, T1.14
- **Critères d'acceptation** :
  - [ ] Actions : `addTemplate`, `updateTemplate`, `deleteTemplate`, `resetToDefaults`
  - [ ] `resetToDefaults` : remplace tous les templates par `DEFAULT_DAY_TEMPLATES` depuis `constants/templates.ts` + persiste dans IDB via `saveTemplate` pour chacun
  - [ ] Write-through sur toutes les mutations
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : section 3.4
- **Tests à prévoir** : implementer écrit des tests simples sur les actions CRUD (pas de TDD strict requis)

---

#### T1.19 — Implémentation `calendarSlice.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/slices/calendarSlice.ts` (création)
- **Dépendances** : T1.09, T1.07
- **Critères d'acceptation** :
  - [ ] State : `eventsByWeek: Record<string, CalendarEvent[]>` (clé = weekStart YYYY-MM-DD)
  - [ ] Action `syncEvents(from: string, to: string)` : appelle `calendarSource.fetchEvents`, stocke en mémoire uniquement (pas d'IDB)
  - [ ] Sélecteur `getEventsForDay(date: string): CalendarEvent[]` : filtre les events dont la plage `[start, end]` chevauche le jour — couvre les shifts nuit dont l'`end` tombe sur le lendemain
  - [ ] En phase 1 : `calendarSource` est hardcodé à `new MockCalendarSource()` dans le slice (Phase 5 : injection via setting)
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : sections 3.1, 4.4

---

#### T1.20 — Implémentation `uiSlice.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/slices/uiSlice.ts` (création)
- **Dépendances** : T1.07
- **Critères d'acceptation** :
  - [ ] State : `selectedDate: string` (today YYYY-MM-DD), `selectedWeekStart: string` (lundi de la semaine courante), `activeModal: string | null`
  - [ ] Actions : `setSelectedDate`, `setSelectedWeekStart`, `setActiveModal`, `closeModal`
  - [ ] Valeurs initiales calculées via `datetime.ts` au moment de la création du store
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : section 6 (architecture fichiers)

---

#### T1.21 — Store racine `useStore.ts` + hydratation + seed

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/store/useStore.ts` (création)
- **Dépendances** : T1.17, T1.18, T1.19, T1.20
- **Critères d'acceptation** :
  - [ ] Store Zustand unique combinant les 4 slices avec immer middleware
  - [ ] Fonction `initializeStore(): Promise<void>` exportée nommée :
    1. Lit IDB → parse avec `safeParseWith` (données corrompues ignorées, warning loggé)
    2. Injecte les WeekPlans et DayTemplates valides dans le store
    3. Si IDB vide (premier démarrage) : appelle `resetToDefaults()` + `syncEvents` pour les 2 semaines autour d'aujourd'hui
  - [ ] En mode dev (`import.meta.env.DEV`) : `window.__store__ = useStore` (l'objet store complet, pas juste `getState`)
  - [ ] La déclaration `window.__store__` est typée dans un fichier `.d.ts` (T1.22) pour éviter les erreurs TS
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf SPEC.md** : sections 4.1, 5

---

#### T1.22 — Déclaration type globale `src/types/global.d.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/types/global.d.ts` (création)
- **Dépendances** : T1.21
- **Critères d'acceptation** :
  - [ ] `interface Window { __store__?: typeof import('@/store/useStore').useStore }` ou équivalent typé
  - [ ] `tsc --noEmit` passe sans erreur sur l'accès `window.__store__` dans `useStore.ts`
- **Tests à prévoir** : aucun

---

#### T1.23 — Branchement `main.tsx` + vérification console

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/main.tsx` (modification)
- **Dépendances** : T1.21, T1.22
- **Critères d'acceptation** :
  - [ ] `initializeStore()` est appelée avant le render React (best-effort : l'hydratation IDB est asynchrone, le render suit immédiatement sans attendre — Phase 2 reverra ce point avec Suspense)
  - [ ] L'app démarre sans erreur (`npm run dev`)
  - [ ] Console navigateur : `window.__store__.getState()` retourne un objet avec les 4 slices
  - [ ] Console navigateur : `window.__store__.getState().weekPlan.assignDayType('2026-04-21', 'off')` produit des instances dans le state
  - [ ] `npm run typecheck` passe sans erreur
- **Réf** : checklist fin de phase ci-dessous

---

### Groupe F — Logger

---

#### T1.24 — Logger dédié `src/lib/logger.ts`

- **Responsable** : implementer
- **Fichiers impactés** :
  - `src/lib/logger.ts` (création)
- **Dépendances** : aucune
- **Critères d'acceptation** :
  - [ ] Export nommé `logger` avec méthodes `info`, `warn`, `error`
  - [ ] Signature : `logger.warn(message: string, context?: Record<string, unknown>): void`
  - [ ] En mode dev (`import.meta.env.DEV`) : délègue à `console.*` (seul endroit légitime du projet)
  - [ ] En mode prod (`import.meta.env.PROD`) : noop silencieux
  - [ ] Pas de `any`
  - [ ] `tsc --noEmit` passe sans erreur
- **Réf CLAUDE.md** : "Pas de console.log commité. Utiliser un logger dédié"
- **Tests à prévoir** : aucun (wrapper trivial)

---

## Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| IDB non disponible en jsdom (vitest) | Haute | Moyen | Mocker `persistence.ts` dans les tests du store via `vi.mock`. Ne pas tester IDB directement en unit. |
| `window.__store__` cause une erreur TS strict | Moyenne | Faible | Déclarer dans `global.d.ts` (T1.22) avant T1.21 |
| Conflits de timezone dayjs dans les tests | Moyenne | Moyen | Fixer `process.env.TZ = 'Europe/Paris'` dans le setup vitest dès T1.06 |
| Shift nuit traversant minuit : mauvais calcul de chevauchement | Haute | Haut | T1.08 et T1.11 couvrent explicitement ce cas. `getEventsForDay` dans calendarSlice prend en compte les events dont la plage chevauche la date |
| `crypto.randomUUID()` non disponible en vitest | Faible | Faible | `idGenerator` optionnel dans `instantiateTemplate` pour les tests déterministes |
| Durée non multiple de 15 dans les constantes templates | Faible | Moyen | Toutes les durées vérifiées manuellement dans T1.04/T1.05 ; `blockTemplateSchema` Zod valide `.refine(n => n % 15 === 0)` |
| Circularité schémas → types → constantes | Faible | Moyen | T1.01 (schemas) n'importe rien du projet. T1.02 (types) importe T1.01. T1.03/T1.04/T1.05 importent T1.02. Ordre strict respecté. |

---

## Tests à prévoir

| Module | Nature | Responsable | Tâche |
|---|---|---|---|
| `lib/schemas.ts` — `safeParseWith` | Unit | implementer | T1.01 |
| `lib/datetime.ts` | Unit | tdd puis implementer | T1.06 + T1.07 |
| `lib/calendarSource.ts` | Unit + contrat interface | tdd puis implementer | T1.08 + T1.09 |
| `lib/templateEngine.ts` cas nominaux | Unit | tdd puis implementer | T1.10 + T1.12 |
| `lib/templateEngine.ts` conflits gcal | Unit | tdd puis implementer | T1.11 + T1.12 |
| `store/weekPlanSlice.ts` lecture/écriture | Unit (mock IDB) | tdd puis implementer | T1.15 + T1.17 |
| `store/weekPlanSlice.ts` assignDayType | Unit (mock IDB) | tdd puis implementer | T1.16 + T1.17 |
| `store/templatesSlice.ts` | Unit simple | implementer | T1.18 |

Couverture cible : > 90% sur `lib/datetime.ts`, `lib/templateEngine.ts`. Les slices store visent > 80% sur les actions.

---

## Ordre d'exécution recommandé

### Chemin critique (séquentiel obligatoire)

```
T1.01 (schemas) → T1.02 (types) → T1.03 (categories) → T1.04 → T1.05 (templates)
                                                                       ↓
T1.24 (logger, peut être fait en parallèle dès T1.01 terminé)

T1.06 → T1.07 → T1.08 → T1.09 → T1.10 → T1.11 → T1.12
                                                      ↓
T1.13 → T1.14 → T1.15 → T1.16 → T1.17
                                    ↓
T1.18 → T1.19 → T1.20 → T1.21 → T1.22 → T1.23
```

### Parallélisations possibles

- **T1.24** (logger) peut démarrer dès T1.01 validé, en parallèle du Groupe B
- **T1.03** (categories.ts) peut démarrer en même temps que T1.06 (tests datetime) une fois T1.02 terminé
- **T1.13** (persistence ouverture DB) peut démarrer en parallèle de T1.10 (tests templateEngine nominaux)
- **T1.18, T1.19, T1.20** peuvent être développés en parallèle une fois T1.17 mergé

### Ordre recommandé pour les sub-agents

1. implementer : T1.01 (schemas Zod — source de vérité)
2. implementer : T1.02 (types inférés) + T1.24 (logger) en parallèle
3. implementer : T1.03, T1.04, T1.05 (constantes avec templates corrigés)
4. tdd : T1.06 (tests datetime)
5. implementer : T1.07 (impl datetime) + T1.13 (persistence DB) en parallèle
6. tdd : T1.08 (tests calendarSource — shifts 07:00→19:00 / 19:00→07:00)
7. implementer : T1.09 (impl calendarSource) + T1.14 (persistence CRUD) en parallèle
8. tdd : T1.10, T1.11 (tests templateEngine)
9. implementer : T1.12 (impl templateEngine)
10. tdd : T1.15, T1.16 (tests weekPlanSlice)
11. implementer : T1.17 (impl weekPlanSlice)
12. implementer : T1.18, T1.19, T1.20 (autres slices)
13. implementer : T1.21, T1.22, T1.23 (store racine + branchement)

---

## Checklist de fin de phase

- [ ] Tous les critères d'acceptation validés tâche par tâche
- [ ] `npm test -- --run` : tous les tests verts, aucun rouge
- [ ] `npm run typecheck` : zéro erreur
- [ ] `npm run lint` : zéro warning bloquant
- [ ] `npm run dev` : app démarre sans erreur console
- [ ] Console navigateur : `window.__store__.getState()` retourne le state complet avec les 4 slices
- [ ] Console navigateur : `window.__store__.getState().weekPlan.assignDayType('2026-04-21', 'off')` produit des instances
- [ ] Console navigateur : après assignation, `window.__store__.getState()` montre les instances dans le DayPlan
- [ ] Aucun `console.log` dans le code source (seul `logger.ts` délègue à console)
- [ ] Aucune couleur hexa dans `categories.ts` ni aucun autre fichier de constants
- [ ] Aucun `any` TypeScript
- [ ] Aucun import relatif profond (`../../../`)
- [ ] Review passée par l'agent `reviewer`
- [ ] SPEC.md à jour si divergence détectée
- [ ] Commit conventionnel + tag `v0.1`

---

## Parking Phase 1

Les éléments suivants ont été identifiés mais sont explicitement hors scope de cette phase :

- **Modal 3 choix lors de ré-application d'un type de jour** (SPEC.md 4.3) : `assignDayType` en Phase 1 écrase sans modal. La modal "Écraser tout / Garder les ajouts manuels / Annuler" est implémentée en Phase 4.
- **`dayTypeManual: true`** : le flag existe dans le type (T1.02) mais n'est pas positionné en Phase 1 (pas de distinction programmatique / manuel sans la modal).
- **`GoogleCalendarSource`** : l'interface `CalendarSource` est posée (T1.09) mais seule `MockCalendarSource` est implémentée. Phase 5.
- **Auto-détection du type de jour depuis les events gcal** (via `autoDetect.titlePattern`) : le champ est typé et renseigné dans les constantes mais la logique de détection n'est pas branchée en Phase 1. Phase 5.
- **`lib/layout.ts`** (calcul 3 colonnes max pour chevauchement visuel) : logique de rendu, Phase 2.
- **`hooks/useCalendarSync.ts`** : hook React qui déclenche `syncEvents` périodiquement, Phase 5.
- **Tests E2E Playwright** : Phase 1 est sans UI, pas de Playwright possible.
- **Migrations IDB version 2+** : la structure est prévue dans le commentaire de `persistence.ts` mais n'est pas implémentée.
- **`status` sur BlockInstance** (planned / done / skipped) : parking V7+, SPEC.md section 11.

---

## Questions ouvertes

**Q1 — Rétraction d'un bloc entouré par un event gcal**
SPEC.md 4.1 indique "la partie qui chevauche est tronquée" sans préciser le comportement si un event gcal est entièrement contenu dans un bloc. Décision retenue : on tronque sur le bord gauche uniquement (le bloc se termine au début de l'event). Règle testée explicitement en T1.11.

**Q2 — `window.__store__` : objet store ou `getState()` ?**
Usage attendu : `window.__store__.getState()`, donc `window.__store__` est le store Zustand complet (avec `getState`, `setState`, `subscribe`). T1.21 expose le store entier.

**Q3 — Hydratation IDB asynchrone et render React**
L'hydratation IDB est asynchrone. En Phase 1 sans UI, ce n'est pas bloquant : `initializeStore()` est appelée et le render React minimal suit immédiatement. Phase 2 reverra ce point (Suspense ou état de chargement).

**Q4 — Source de vérité Zod vs types manuels (résolu v2)**
Les schémas Zod (`src/lib/schemas.ts`) sont la source de vérité. Les types TypeScript sont exclusivement `z.infer<typeof schema>`. Aucune redéfinition manuelle autorisée. Cette décision simplifie la maintenance et garantit que les types runtime et compile-time sont toujours alignés.
