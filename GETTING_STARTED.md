# Daily Block Planner — Guide utilisateur

Ce doc t'accompagne **de zéro au projet fonctionnel**. Il indique précisément ce que **toi** tu fais à chaque étape, et ce que Claude Code fait.

---

## Avant de commencer

### Prérequis à vérifier sur ton poste

```bash
node --version    # ≥ 20
npm --version     # ≥ 10
git --version
claude --version  # Claude Code installé
```

Si Claude Code n'est pas installé :
```bash
npm install -g @anthropic-ai/claude-code
```

### Créer le dossier du projet

```bash
mkdir ~/projects/daily-block-planner
cd ~/projects/daily-block-planner
git init
```

Puis **copier dans ce dossier** les fichiers que je t'ai livrés :
- `SPEC.md`
- `CLAUDE.md`
- `.mcp.json`
- `.claude/` (dossier complet avec agents + skills)

Structure attendue après copie :
```
daily-block-planner/
├── .claude/
│   ├── agents/
│   │   ├── architect.md
│   │   ├── tdd.md
│   │   ├── implementer.md
│   │   ├── reviewer.md
│   │   └── refactor.md
│   └── skills/
│       ├── react-ts-patterns/SKILL.md
│       └── material-tokens/SKILL.md
├── .mcp.json
├── CLAUDE.md
└── SPEC.md
```

Puis :
```bash
git add -A
git commit -m "chore: project scaffold (spec, agents, skills, mcp)"
```

---

## Configuration MCPs

Les trois MCPs sont déclarés dans `.mcp.json` à la racine. Quand tu lances Claude Code dans ce dossier, il te proposera de les activer à la première exécution (confirmation de sécurité). Accepte les trois.

### Si un MCP ne démarre pas

- **context7** : en HTTP, nécessite internet. Pas d'install locale.
- **playwright** : au premier usage, Playwright télécharge les navigateurs (~200 Mo). Normal.
- **chrome-devtools** : nécessite Chrome ou Chromium installé.

Tu peux toujours lister l'état des MCPs dans Claude Code avec `/mcp`.

---

## Workflow général d'une phase

Pour **chaque** phase (0 à 6) le cycle est le même :

```
1. git checkout -b phase-N-nom
2. claude
3. (dans Claude Code) coller le prompt de phase → l'architect produit PHASE_N_PLAN.md
4. Tu relis PHASE_N_PLAN.md, tu valides ou tu demandes des ajustements
5. Tu demandes à Claude Code d'exécuter la phase :
   - pour les modules logique : @tdd puis @implementer
   - pour les composants visuels : @implementer directement
6. Tu lances l'app et tu cliques toi-même
7. @reviewer à la fin → produit REVIEW_PHASE_N.md
8. Tu traites les findings (via @refactor ou @implementer)
9. Commit (conventional commits), merge dans main, tag v0.N
10. Reviens me voir pour le prompt de la phase suivante
```

---

## Phase 0 — Fondations

### Objectif
Squelette d'app qui tourne avec la stack en place, tokens Material installés, CI locale opérationnelle. Pas de fonctionnel.

### Commandes toi

```bash
git checkout -b phase-0-fondations
claude
```

### Prompt à coller dans Claude Code

```
Lis CLAUDE.md et SPEC.md intégralement.

Nous démarrons la Phase 0 — Fondations.

Invoque @architect pour produire PHASE_0_PLAN.md couvrant :
- Setup Vite + React 19 + TypeScript strict
- Installation dépendances listées section 5 de SPEC.md
- Configuration Tailwind v4 avec CSS vars Material 3 (tokens depuis skill material-tokens)
- Alias @/ dans tsconfig et vite.config
- Setup Vitest + React Testing Library + msw
- Scripts npm : dev, build, test, typecheck, lint
- ESLint + Prettier config minimale
- Structure dossiers src/ selon section 6 de SPEC.md (dossiers vides avec .gitkeep)
- README.md minimal
- .gitignore adapté
- Sanity test : un composant <App /> qui render "Daily Block Planner" + un test vitest qui le vérifie

Arrête-toi après PHASE_0_PLAN.md, je valide avant d'exécuter.
```

### Ce que tu valides
L'architect produit `PHASE_0_PLAN.md`. Tu le lis.

Points à vérifier :
- [ ] Stack conforme à SPEC.md section 5
- [ ] Aucune dépendance en plus
- [ ] Scripts npm listés et cohérents
- [ ] Tokens Material sont prévus dans un fichier centralisé

Si OK :
```
Plan validé. Exécute la Phase 0. Utilise @implementer.
```

### Test utilisateur fin de phase

```bash
npm install      # si pas encore fait
npm run dev
```

→ Ouvrir `http://localhost:5173`, voir "Daily Block Planner" s'afficher.

```bash
npm test -- --run
npm run typecheck
npm run lint
```

Tous verts = Phase 0 OK.

### Clôture
```
Invoque @reviewer pour finaliser la Phase 0.
```
Traiter les findings. Puis :
```bash
git add -A
git commit -m "feat: phase 0 fondations"
git checkout main
git merge phase-0-fondations
git tag v0.0
```

**Reviens me voir avec le lien du commit ou un screenshot pour que je te passe le prompt Phase 1.**

---

## Phase 1 — Modèle + store + seed

### Objectif
Tous les types TS définis, store Zustand complet avec slices, persistance IndexedDB, seed data. Zéro UI.

### Tu fais
```bash
git checkout main
git checkout -b phase-1-modele
claude
```

Je te passerai le prompt précis une fois Phase 0 fermée.

### Grandes lignes
- TDD sur le store (actions testables)
- TDD sur `templateEngine.instantiate()`
- Persistance IndexedDB avec migrations simples (version 1)
- Seed : 4 DayTemplate + 2 semaines de mock gcal events

### Test utilisateur fin de phase
Ouvrir devtools, dans la console :
```js
window.__store__.getState()    // explorer le store
window.__store__.getState().weekPlan.assignDayType('2026-04-20', 'off')
```
→ Voir les instances apparaître dans le state.

---

## Phase 2 — Vue semaine read-only

### Objectif
La grille s'affiche. Les blocs et events du store sont rendus à leur position. Pas d'interaction.

### Grandes lignes
- `WeekGrid` (7 × 24h)
- Layout chevauchement 3 colonnes max
- Navigation semaines
- Responsive : vue jour sur mobile, semaine sur desktop
- Rendu split pour blocs traversant minuit

### Test utilisateur fin de phase
Naviguer entre semaines, vérifier que les seeds s'affichent. Basculer mobile (devtools responsive) et vérifier la vue jour.

---

## Phase 3 — Interactions blocs

### Objectif
Édition complète : créer, déplacer, resize, supprimer.

### Grandes lignes
- @dnd-kit pour drag + custom resize handles
- Snap 15 min
- BlockEditorSheet (bottom sheet mobile, side panel desktop)
- Gestion chevauchement pendant drag

### Test utilisateur fin de phase
Créer un bloc en cliquant sur la grille, le déplacer, le redimensionner, le supprimer. Sur desktop et mobile.

### MCP utilisé
`@reviewer` peut invoquer `playwright` pour un smoke test du parcours création → déplacement → resize.

---

## Phase 4 — Templates de jour

### Objectif
Popover date fonctionnel, application d'un template génère les blocs, éditeur de templates.

### Grandes lignes
- `DayTypePopover`
- Modal de confirmation si jour déjà peuplé
- `/templates` : CRUD DayTemplate
- `BlockLibrary` : blocs préfabriqués réutilisables

### Test utilisateur fin de phase
Cliquer sur une date → assigner OFF → voir le template se dérouler sur la journée. Modifier un template, ré-assigner, vérifier la modal écrase/garde.

---

## Phase 5 — Google Calendar

### Objectif
OAuth Google réel, sync events, auto-détection type de jour.

### Grandes lignes
- `GoogleCalendarSource` implémente l'interface
- OAuth2 via Google Identity Services côté front
- Scope `calendar.readonly`
- Page `/settings/calendar` : connexion, choix agendas, fréquence sync

### Prérequis toi
- Créer un projet Google Cloud Console
- Activer Calendar API
- Créer un OAuth client ID (Web application)
- Ajouter `http://localhost:5173` et `http://localhost:4173` comme origines autorisées
- Copier client ID dans un `.env.local` (jamais commité)

Je te guide en détail quand on y sera.

---

## Phase 6 — Polish

### Objectif
App utilisable au quotidien : animations, PWA, export JSON, empty states, error boundaries.

### Grandes lignes
- framer-motion sur transitions
- Manifest + service worker (vite-plugin-pwa)
- Installable sur mobile
- Export complet store en JSON + import

---

## Commandes utiles Claude Code

Dans une session Claude Code :

| Commande | Effet |
|---|---|
| `/mcp` | Liste état des MCPs |
| `/agents` | Liste des sub-agents disponibles |
| `@architect ...` | Invoque explicitement l'architect |
| `/model` | Change le modèle utilisé |
| `/clear` | Reset du contexte de la session |
| `/cost` | Consommation de la session |
| `/review` | Review du dernier changement |

Le `@<agent>` force Claude à passer par cet agent. Sans mention, Claude Code sélectionne selon la description.

---

## En cas de dérive

Si Claude Code commence à dépasser le scope, inventer des features non spec, ou bricoler un contournement douteux :

1. `/clear` (reset contexte)
2. Relire SPEC.md avec lui : `Relis SPEC.md et rappelle-moi les règles 4.1 à 4.5`
3. Reformuler la tâche de façon plus bornée
4. Si persistance : venir me voir, on ajuste le sub-agent ou la spec

---

## Conventions commit

```
feat(scope): nouvelle fonctionnalité
fix(scope): correction bug
refactor(scope): refactor sans changement comportement
test(scope): ajout/modif tests
docs(scope): doc uniquement
chore(scope): tooling, config
perf(scope): perf
style(scope): formatage, pas de logique
```

Exemples :
- `feat(layout): compute overlap columns`
- `test(template-engine): add conflict resolution cases`
- `refactor(store): split week-plan slice`

---

Prêt pour la Phase 0.
