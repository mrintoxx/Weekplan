# Phase 0 — Fondations — Plan d'action

## Résumé

Établir le squelette technique complet du projet Daily Block Planner : stack Vite + React 19 + TypeScript strict, configuration Tailwind v4 avec tokens Material 3, infrastructure de tests (Vitest + RTL + MSW), scripts npm, qualité code (ESLint + Prettier), structure de dossiers, et validation sanity (app qui démarre + test vert).

**Livrable attendu :** Un projet qui passe `npm run dev`, `npm run build`, `npm test`, `npm run typecheck`, `npm run lint` avec succès. Affichage minimal "Daily Block Planner" dans le navigateur. Aucune fonctionnalité métier.

---

## Questions bloquantes

**Aucune.** La stack est clairement spécifiée dans SPEC.md section 5. Tous les détails de configuration sont déterministes.

---

## Découpage en tâches

### T1 — Initialisation npm et installation des dépendances

**Description :** Initialiser `package.json` et installer toutes les dépendances listées dans SPEC.md section 5.

**Fichiers touchés :**
- Création : `package.json`
- Création : `package-lock.json`

**Commandes npm :**
```bash
npm init -y

# Dependencies
npm install react@^19 react-dom@^19
npm install zustand immer
npm install @dnd-kit/core @dnd-kit/modifiers
npm install dayjs
npm install idb
npm install react-router@^7 react-router-dom@^7
npm install zod
npm install lucide-react

# DevDependencies
npm install -D vite@latest @vitejs/plugin-react
npm install -D typescript @types/react @types/react-dom
npm install -D tailwindcss@next @tailwindcss/vite@next
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D msw@latest
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react eslint-plugin-react-hooks
npm install -D prettier
```

**Dépendances :** Aucune.

**Critère d'acceptation :** `package.json` contient toutes les dépendances listées, avec React 19 et Tailwind v4 (next). `npm install` se termine sans erreur.

**Responsable :** implementer

---

### T2 — Configuration TypeScript strict

**Description :** Créer `tsconfig.json` et `tsconfig.node.json` avec mode strict activé, alias `@/` vers `src/`, et toutes les options strictes mentionnées dans skill react-ts-patterns.

**Fichiers touchés :**
- Création : `tsconfig.json`
- Création : `tsconfig.node.json`

**Contenu `tsconfig.json` :**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Contenu `tsconfig.node.json` :**
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Dépendances :** T1

**Critère d'acceptation :** `npx tsc --noEmit` s'exécute sans erreur (une fois les fichiers sources créés dans T5+).

**Responsable :** implementer

---

### T3 — Configuration Vite + alias @/

**Description :** Créer `vite.config.ts` avec plugin React, plugin Tailwind v4, et alias `@/` résolu vers `src/`.

**Fichiers touchés :**
- Création : `vite.config.ts`

**Contenu `vite.config.ts` :**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

**Dépendances :** T1, T2

**Critère d'acceptation :** Vite démarre sans erreur avec `npm run dev`. Alias `@/` fonctionne dans les imports TypeScript.

**Responsable :** implementer

---

### T4 — Configuration Tailwind v4 + tokens Material 3

**Description :** Créer le fichier `src/constants/theme.ts` définissant les CSS custom properties Material 3 (section material-tokens du skill). Créer `src/index.css` qui injecte ces tokens en `:root` et importe Tailwind. Configurer Tailwind pour consommer ces variables.

**Fichiers touchés :**
- Création : `src/constants/theme.ts`
- Création : `src/index.css`

**Contenu `src/constants/theme.ts` :**
```ts
/**
 * Material 3 Design Tokens
 * Définit les CSS custom properties consommées par Tailwind et les composants.
 * RÈGLE ABSOLUE : aucune couleur hexa en dur dans le code. Toujours passer par ces tokens.
 */

export const materialTokens = {
  // Primary palette
  '--md-primary': 'hsl(220, 90%, 56%)',
  '--md-on-primary': 'hsl(0, 0%, 100%)',
  '--md-primary-container': 'hsl(220, 90%, 95%)',
  '--md-on-primary-container': 'hsl(220, 90%, 10%)',

  // Secondary palette
  '--md-secondary': 'hsl(200, 70%, 50%)',
  '--md-on-secondary': 'hsl(0, 0%, 100%)',
  '--md-secondary-container': 'hsl(200, 70%, 90%)',
  '--md-on-secondary-container': 'hsl(200, 70%, 10%)',

  // Tertiary palette
  '--md-tertiary': 'hsl(280, 60%, 60%)',
  '--md-on-tertiary': 'hsl(0, 0%, 100%)',
  '--md-tertiary-container': 'hsl(280, 60%, 95%)',
  '--md-on-tertiary-container': 'hsl(280, 60%, 15%)',

  // Error palette
  '--md-error': 'hsl(0, 84%, 60%)',
  '--md-on-error': 'hsl(0, 0%, 100%)',
  '--md-error-container': 'hsl(0, 84%, 95%)',
  '--md-on-error-container': 'hsl(0, 84%, 12%)',

  // Surface palette
  '--md-surface': 'hsl(220, 15%, 8%)',
  '--md-surface-dim': 'hsl(220, 15%, 6%)',
  '--md-surface-bright': 'hsl(220, 15%, 20%)',
  '--md-surface-container-lowest': 'hsl(220, 15%, 4%)',
  '--md-surface-container-low': 'hsl(220, 15%, 10%)',
  '--md-surface-container': 'hsl(220, 15%, 12%)',
  '--md-surface-container-high': 'hsl(220, 15%, 17%)',
  '--md-surface-container-highest': 'hsl(220, 15%, 22%)',
  '--md-on-surface': 'hsl(220, 15%, 90%)',
  '--md-on-surface-variant': 'hsl(220, 10%, 70%)',
  '--md-outline': 'hsl(220, 10%, 50%)',
  '--md-outline-variant': 'hsl(220, 10%, 30%)',

  // Block category colors (WCAG AA compliant on dark surface)
  '--cat-sport': 'hsl(15, 85%, 60%)',
  '--cat-reno': 'hsl(35, 80%, 55%)',
  '--cat-bebe': 'hsl(320, 70%, 65%)',
  '--cat-repos': 'hsl(200, 60%, 55%)',
  '--cat-perso': 'hsl(280, 65%, 60%)',
  '--cat-travail': 'hsl(140, 55%, 50%)',
  '--cat-transition': 'hsl(40, 70%, 60%)',
  '--cat-homelab': 'hsl(180, 60%, 50%)',
  '--cat-famille': 'hsl(340, 75%, 60%)',

  // Shape tokens (border radius)
  '--md-shape-none': '0',
  '--md-shape-xs': '4px',
  '--md-shape-sm': '8px',
  '--md-shape-md': '12px',
  '--md-shape-lg': '16px',
  '--md-shape-xl': '28px',
  '--md-shape-full': '9999px',

  // Elevation (shadows)
  '--md-elevation-0': 'none',
  '--md-elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
  '--md-elevation-2': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
  '--md-elevation-3': '0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.3)',
  '--md-elevation-4': '0 6px 10px 4px rgb(0 0 0 / 0.15), 0 2px 3px 0 rgb(0 0 0 / 0.3)',
  '--md-elevation-5': '0 8px 12px 6px rgb(0 0 0 / 0.15), 0 4px 4px 0 rgb(0 0 0 / 0.3)',
} as const;
```

**Contenu `src/index.css` :**
```css
@import "tailwindcss";

:root {
  /* Primary */
  --md-primary: hsl(220, 90%, 56%);
  --md-on-primary: hsl(0, 0%, 100%);
  --md-primary-container: hsl(220, 90%, 95%);
  --md-on-primary-container: hsl(220, 90%, 10%);

  /* Secondary */
  --md-secondary: hsl(200, 70%, 50%);
  --md-on-secondary: hsl(0, 0%, 100%);
  --md-secondary-container: hsl(200, 70%, 90%);
  --md-on-secondary-container: hsl(200, 70%, 10%);

  /* Tertiary */
  --md-tertiary: hsl(280, 60%, 60%);
  --md-on-tertiary: hsl(0, 0%, 100%);
  --md-tertiary-container: hsl(280, 60%, 95%);
  --md-on-tertiary-container: hsl(280, 60%, 15%);

  /* Error */
  --md-error: hsl(0, 84%, 60%);
  --md-on-error: hsl(0, 0%, 100%);
  --md-error-container: hsl(0, 84%, 95%);
  --md-on-error-container: hsl(0, 84%, 12%);

  /* Surface */
  --md-surface: hsl(220, 15%, 8%);
  --md-surface-dim: hsl(220, 15%, 6%);
  --md-surface-bright: hsl(220, 15%, 20%);
  --md-surface-container-lowest: hsl(220, 15%, 4%);
  --md-surface-container-low: hsl(220, 15%, 10%);
  --md-surface-container: hsl(220, 15%, 12%);
  --md-surface-container-high: hsl(220, 15%, 17%);
  --md-surface-container-highest: hsl(220, 15%, 22%);
  --md-on-surface: hsl(220, 15%, 90%);
  --md-on-surface-variant: hsl(220, 10%, 70%);
  --md-outline: hsl(220, 10%, 50%);
  --md-outline-variant: hsl(220, 10%, 30%);

  /* Categories */
  --cat-sport: hsl(15, 85%, 60%);
  --cat-reno: hsl(35, 80%, 55%);
  --cat-bebe: hsl(320, 70%, 65%);
  --cat-repos: hsl(200, 60%, 55%);
  --cat-perso: hsl(280, 65%, 60%);
  --cat-travail: hsl(140, 55%, 50%);
  --cat-transition: hsl(40, 70%, 60%);
  --cat-homelab: hsl(180, 60%, 50%);
  --cat-famille: hsl(340, 75%, 60%);

  /* Shape */
  --md-shape-none: 0;
  --md-shape-xs: 4px;
  --md-shape-sm: 8px;
  --md-shape-md: 12px;
  --md-shape-lg: 16px;
  --md-shape-xl: 28px;
  --md-shape-full: 9999px;

  /* Elevation */
  --md-elevation-0: none;
  --md-elevation-1: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);
  --md-elevation-2: 0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15);
  --md-elevation-3: 0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.3);
  --md-elevation-4: 0 6px 10px 4px rgb(0 0 0 / 0.15), 0 2px 3px 0 rgb(0 0 0 / 0.3);
  --md-elevation-5: 0 8px 12px 6px rgb(0 0 0 / 0.15), 0 4px 4px 0 rgb(0 0 0 / 0.3);
}

body {
  margin: 0;
  font-family: 'Roboto Flex', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--md-surface);
  color: var(--md-on-surface);
}

* {
  box-sizing: border-box;
}
```

**Dépendances :** T1, T3

**Critère d'acceptation :** Les tokens CSS sont définis et injectés. Tailwind compile sans erreur. Les classes arbitrary values `bg-[var(--md-primary)]` fonctionnent.

**Responsable :** implementer

---

### T5 — Structure de dossiers src/

**Description :** Créer l'arborescence de dossiers selon SPEC.md section 6. Placer un `.gitkeep` dans chaque dossier vide pour que Git les trace.

**Fichiers touchés :**
- Création : `src/types/.gitkeep`
- Création : `src/constants/.gitkeep`
- Création : `src/store/.gitkeep`
- Création : `src/store/slices/.gitkeep`
- Création : `src/lib/.gitkeep`
- Création : `src/components/.gitkeep`
- Création : `src/components/WeekView/.gitkeep`
- Création : `src/components/DayTypePopover/.gitkeep`
- Création : `src/components/BlockEditor/.gitkeep`
- Création : `src/components/TemplateManager/.gitkeep`
- Création : `src/components/common/.gitkeep`
- Création : `src/hooks/.gitkeep`
- Création : `src/test/.gitkeep`

**Arborescence finale :**
```
src/
├── types/
├── constants/
│   └── theme.ts (déjà créé T4)
├── store/
│   └── slices/
├── lib/
├── components/
│   ├── WeekView/
│   ├── DayTypePopover/
│   ├── BlockEditor/
│   ├── TemplateManager/
│   └── common/
├── hooks/
├── test/
├── index.css (déjà créé T4)
├── App.tsx (T7)
├── App.test.tsx (T7)
└── main.tsx (T7)
```

**Dépendances :** Aucune (peut être parallèle à T1-4)

**Critère d'acceptation :** Tous les dossiers listés dans SPEC.md section 6 existent avec `.gitkeep`.

**Responsable :** implementer

---

### T6 — Configuration Vitest + React Testing Library + MSW

**Description :** Créer fichier de setup Vitest et initialiser MSW pour mock réseau (configuration basique, handlers ajoutés en Phase 5).

**Fichiers touchés :**
- Création : `src/test/setup.ts`
- Création : `src/test/mocks/handlers.ts`
- Création : `src/test/mocks/server.ts`

**Contenu `src/test/setup.ts` :**
```ts
import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Établir les mocks API avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers après chaque test
afterEach(() => server.resetHandlers());

// Nettoyer après tous les tests
afterAll(() => server.close());
```

**Contenu `src/test/mocks/handlers.ts` :**
```ts
import { http, HttpResponse } from 'msw';

/**
 * Handlers MSW pour mocker les appels réseau en tests.
 * Phase 0 : vide, sera peuplé en Phase 5 pour Google Calendar API.
 */
export const handlers = [
  // Exemple de handler (à remplacer en Phase 5)
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
```

**Contenu `src/test/mocks/server.ts` :**
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configure le serveur MSW avec nos handlers
export const server = setupServer(...handlers);
```

**Dépendances :** T1, T3 (config Vite avec test setup)

**Critère d'acceptation :** Un test minimal (T7) passe avec `npm test`. MSW est configuré et ne génère pas d'erreur.

**Responsable :** implementer

---

### T7 — Composant App.tsx + sanity test

**Description :** Créer le composant minimal `App.tsx` affichant "Daily Block Planner" et un test associé validant le rendu. Créer `main.tsx` qui monte React.

**Fichiers touchés :**
- Création : `src/App.tsx`
- Création : `src/App.test.tsx`
- Création : `src/main.tsx`

**Contenu `src/main.tsx` :**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Contenu `src/App.tsx` :**
```tsx
export function App() {
  return (
    <div className="min-h-screen bg-[var(--md-surface)] text-[var(--md-on-surface)] flex items-center justify-center">
      <h1 className="text-4xl font-bold text-[var(--md-primary)]">
        Daily Block Planner
      </h1>
    </div>
  );
}
```

**Contenu `src/App.test.tsx` :**
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { name: /daily block planner/i });
    expect(heading).toBeInTheDocument();
  });

  it('applies Material 3 theme tokens', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { name: /daily block planner/i });
    expect(heading).toHaveClass('text-[var(--md-primary)]');
  });
});
```

**Dépendances :** T4 (CSS), T6 (test setup)

**Critère d'acceptation :** `npm test -- --run` passe au vert. `npm run dev` affiche "Daily Block Planner" avec le token Material 3 appliqué (couleur primaire visible).

**Responsable :** implementer

---

### T8 — index.html

**Description :** Créer le fichier HTML racine utilisé par Vite.

**Fichiers touchés :**
- Création : `index.html`

**Contenu `index.html` :**
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Application de planning par blocs de temps" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <title>Daily Block Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Dépendances :** Aucune

**Critère d'acceptation :** Vite charge l'app sans erreur au démarrage.

**Responsable :** implementer

---

### T9 — Scripts npm dans package.json

**Description :** Ajouter tous les scripts listés dans SPEC.md et CLAUDE.md.

**Fichiers touchés :**
- Modification : `package.json`

**Scripts à ajouter :**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "typecheck": "tsc --noEmit",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\""
}
```

**Dépendances :** T1

**Critère d'acceptation :** Tous les scripts s'exécutent sans erreur (une fois les autres tâches terminées).

**Responsable :** implementer

---

### T10 — ESLint configuration

**Description :** Créer `.eslintrc.cjs` avec règles TypeScript et React. Config minimale, stricte sur l'usage de `any`.

**Fichiers touchés :**
- Création : `.eslintrc.cjs`

**Contenu `.eslintrc.cjs` :**
```cjs
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
```

**Dépendances :** T1

**Critère d'acceptation :** `npm run lint` passe sans erreur une fois le code écrit. Interdiction explicite de `any`.

**Responsable :** implementer

---

### T11 — Prettier configuration

**Description :** Créer `.prettierrc.json` avec config minimale selon CLAUDE.md.

**Fichiers touchés :**
- Création : `.prettierrc.json`

**Contenu `.prettierrc.json` :**
```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**Dépendances :** T1

**Critère d'acceptation :** `npm run format:check` passe. Formatage cohérent avec la convention projet.

**Responsable :** implementer

---

### T12 — .gitignore

**Description :** Créer `.gitignore` adapté au projet.

**Fichiers touchés :**
- Création : `.gitignore`

**Contenu `.gitignore` :**
```
# Dependencies
node_modules/

# Build outputs
dist/
build/
*.local

# Environment
.env
.env.local
.env.*.local

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Vitest
.vitest/

# Misc
*.tsbuildinfo
```

**Dépendances :** Aucune

**Critère d'acceptation :** `node_modules`, `dist`, `.env` ne sont pas trackés par Git.

**Responsable :** implementer

---

### T13 — README.md minimal

**Description :** Créer README avec titre, stack, et commandes de dev.

**Fichiers touchés :**
- Création : `README.md`

**Contenu `README.md` :**
```md
# Daily Block Planner

Application de planning par blocs de temps, développée pour structurer les journées des personnes avec TDAH, shifts alternants, ou toute activité nécessitant une planification granulaire.

## Stack

- **Build** : Vite
- **UI** : React 19 + TypeScript strict
- **CSS** : Tailwind v4 + Material 3 Design Tokens
- **State** : Zustand + Immer
- **Persistence** : IndexedDB (via idb)
- **Drag & Drop** : @dnd-kit
- **Dates** : dayjs
- **Routing** : React Router v7
- **Validation** : Zod
- **Icons** : Lucide React
- **Tests** : Vitest + React Testing Library + MSW

## Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Build production
npm run build

# Tests
npm test
npm run test:ui

# Typecheck
npm run typecheck

# Linter
npm run lint

# Format
npm run format
```

## Architecture

Voir `SPEC.md` pour la spécification complète du modèle de données et des règles métier.

Voir `CLAUDE.md` pour les conventions de code et le workflow de développement avec Claude Code.

## Phases de développement

- [x] Phase 0 : Fondations (stack, tokens, tests, structure)
- [ ] Phase 1 : Modèle + store + seed
- [ ] Phase 2 : Vue semaine read-only
- [ ] Phase 3 : Interactions (drag, resize, CRUD)
- [ ] Phase 4 : Templates de jour
- [ ] Phase 5 : Google Calendar sync
- [ ] Phase 6 : Polish (PWA, animations, export)

## Licence

Projet personnel. Non open-source pour le moment.
```

**Dépendances :** Aucune

**Critère d'acceptation :** README présent, informations correctes, liste de commandes opérationnelles.

**Responsable :** implementer

---

### T14 — Validation end-to-end (smoke test)

**Description :** Valider que tous les scripts npm fonctionnent et que l'app démarre correctement.

**Fichiers touchés :** Aucun (vérification seulement)

**Commandes à exécuter :**
```bash
npm run dev           # → doit démarrer sur http://localhost:5173
npm run build         # → doit produire dist/
npm run typecheck     # → pas d'erreur TS
npm run lint          # → pas d'erreur ESLint
npm run format:check  # → formatage correct
npm test -- --run     # → tests au vert
```

**Dépendances :** T1 à T13 (toutes les tâches précédentes)

**Critère d'acceptation :** Toutes les commandes passent. L'app affiche "Daily Block Planner" dans le navigateur avec le style Material 3 appliqué (fond sombre, texte clair, titre en couleur primaire).

**Responsable :** implementer

---

## Risques et mitigations

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Tailwind v4 (encore en next) API instable | Moyen | Faible | Version @next spécifiée, doc Context7 MCP pour vérifier syntaxe actuelle |
| React 19 breaking changes vs doc | Moyen | Faible | Context7 MCP pour vérifier API React 19, tests de sanity couvrent le rendu de base |
| MSW v2 setup complexe | Faible | Moyen | Setup basique Phase 0, handlers peuplés en Phase 5 quand besoin réel |
| Alias `@/` non résolu dans tests | Faible | Moyen | Config Vite `resolve.alias` testée en T3, validée en T14 |
| Import CSS vars Tailwind incomplet | Moyen | Faible | Tokens définis manuellement en `:root` ET dans `theme.ts`, double source pour debug |

---

## Tests à prévoir

### T6 — Setup test infrastructure
- **Nature :** Configuration (pas de test unitaire proprement dit)
- **Validation :** MSW serveur démarre sans erreur, `setup.ts` importé par Vitest

### T7 — Sanity test App.tsx
- **Nature :** Component test (RTL)
- **Tests :**
  1. Le heading "Daily Block Planner" est rendu
  2. Les classes Tailwind avec CSS vars sont appliquées
- **Couverture :** Valide que React 19, RTL, Vitest, et Tailwind fonctionnent ensemble

### T14 — Validation end-to-end
- **Nature :** Smoke test manuel
- **Checklist :**
  - [ ] `npm run dev` démarre sans erreur
  - [ ] Navigateur affiche le titre avec couleur primaire
  - [ ] `npm run build` produit `dist/`
  - [ ] `npm test -- --run` → tous les tests verts
  - [ ] `npm run typecheck` → aucune erreur TypeScript
  - [ ] `npm run lint` → aucune erreur ESLint
  - [ ] `npm run format:check` → formatage correct

---

## Checklist de fin de phase

- [ ] Tous les scripts npm définis et fonctionnels (`dev`, `build`, `test`, `typecheck`, `lint`, `format`)
- [ ] Structure `src/` conforme à SPEC.md section 6 avec tous les dossiers vides créés
- [ ] Tokens Material 3 définis dans `src/constants/theme.ts` et injectés dans `src/index.css`
- [ ] Alias `@/` résolu dans TypeScript et Vite
- [ ] Test de sanity `App.test.tsx` passe au vert
- [ ] `npm run dev` affiche "Daily Block Planner" avec thème Material 3 appliqué
- [ ] `npm run build` produit un build sans erreur
- [ ] `npm run typecheck` ne remonte aucune erreur TypeScript
- [ ] `npm run lint` ne remonte aucune erreur ESLint (règle `no-explicit-any` activée)
- [ ] `.gitignore` présent et exclut `node_modules`, `dist`, `.env`
- [ ] README.md minimal avec stack et commandes
- [ ] Aucun `console.log` commité
- [ ] Aucune couleur hexa en dur dans le code
- [ ] Review passée par `@reviewer`
- [ ] Commit avec message `feat(phase-0): foundations complete`
- [ ] Tag `v0.0` créé

---

## Parking (hors scope Phase 0)

- Logger dédié (à implémenter en Phase 1 ou Phase 2)
- Dark/Light mode toggle (Phase 6)
- Configuration Playwright E2E (Phase 3+, via MCP)
- Service Worker / PWA manifest (Phase 6)
- React Router configuration (Phase 2, quand routes nécessaires)
- Zustand store (Phase 1)
- IndexedDB persistence (Phase 1)

---

## Notes d'implémentation

### Ordre d'exécution recommandé

Tâches parallélisables (aucune dépendance croisée) :
- Bloc A : T1, T2, T5, T8, T12, T13
- Bloc B : T3 (après T1, T2)
- Bloc C : T4 (après T1, T3)
- Bloc D : T6 (après T1, T3)
- Bloc E : T7 (après T4, T6)
- Bloc F : T9, T10, T11 (après T1)
- Bloc G : T14 (après toutes les autres)

### Vérifications intermédiaires

Après chaque bloc :
1. `npm run typecheck` → doit passer
2. `npm run lint` → doit passer
3. Commit intermédiaire si le bloc est cohérent

### Points d'attention

- **Pas de couleur hexa en dur** : vérifier chaque fichier CSS/TSX créé
- **Pas de `any`** : ESLint configuré pour bloquer, mais rester vigilant
- **Imports nommés uniquement** : `export function App()`, jamais `export default`
- **Alias `@/`** : à utiliser dès qu'un import traverse plus de 2 niveaux relatifs

---

**Fin du plan Phase 0.**
