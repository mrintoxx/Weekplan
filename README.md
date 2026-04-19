# Daily Block Planner

Application web de planning par blocs pour structurer vos journées.

## Stack Technique

- **Build**: Vite
- **UI**: React 19 + TypeScript strict
- **CSS**: Tailwind v4 + Material 3 tokens
- **State**: Zustand + immer
- **Drag & Drop**: @dnd-kit
- **Dates**: dayjs
- **Storage**: IndexedDB (idb)
- **Routing**: react-router v7
- **Tests**: Vitest + React Testing Library + MSW

## Scripts de développement

```bash
# Développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Tests
npm test              # mode watch
npm run test:ui       # interface vitest
npm run test:run      # run once

# Qualité code
npm run typecheck     # vérification TypeScript
npm run lint          # ESLint
npm run format        # Prettier
```

## Architecture

Voir `SPEC.md` pour la spécification complète et `CLAUDE.md` pour les conventions de développement.

## Phase actuelle

**Phase 0**: Fondations  Stack initialisée, tokens Material 3 configurés, infrastructure de tests en place.
