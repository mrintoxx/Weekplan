---
name: react-ts-patterns
description: Conventions React + TypeScript du projet Daily Block Planner. À consulter avant d'écrire ou modifier un composant, hook, ou module TypeScript.
---

# Conventions React + TypeScript

## 1. Composants

- **Composants fonctionnels uniquement**. Pas de classes.
- **Pas de `default export`**. Named export partout, y compris pour les composants.
  ```tsx
  // ❌
  export default function BlockTile() { ... }

  // ✅
  export function BlockTile() { ... }
  ```
- **Un composant = un dossier** : `components/BlockTile/BlockTile.tsx`, `BlockTile.test.tsx`, `BlockTile.module.css` si nécessaire, `index.ts` qui re-export.
- **Props typées avec `type` inline ou adjacent** :
  ```tsx
  type BlockTileProps = {
    block: BlockInstance;
    onEdit: (id: string) => void;
  };

  export function BlockTile({ block, onEdit }: BlockTileProps) { ... }
  ```
- **Pas de `React.FC`**. Typage direct des props suffit et évite les implicites.

## 2. Hooks

- **Co-localisés avec leur consommateur** s'ils ne sont utilisés qu'à un endroit
- **Dans `src/hooks/`** s'ils sont partagés
- **Convention `use<Nom>`** obligatoire
- **Un hook = une responsabilité**. `useDragBlock` drague, il ne sauvegarde pas. `useSaveBlock` sauvegarde.
- **Dépendances complètes** : jamais de `// eslint-disable-next-line react-hooks/exhaustive-deps`. Si une dépendance pose problème, c'est le design du hook qui est à revoir.

## 3. State

- **State local** pour ce qui ne quitte pas le composant
- **Zustand store** pour tout ce qui est partagé ou persisté
- **Pas de prop drilling > 2 niveaux**. Au-delà, passer par le store ou un context local scopé.
- **État dérivé = `useMemo` ou sélecteur Zustand**, jamais `useEffect` qui set un state.
  ```tsx
  // ❌
  const [fullName, setFullName] = useState('');
  useEffect(() => setFullName(`${first} ${last}`), [first, last]);

  // ✅
  const fullName = useMemo(() => `${first} ${last}`, [first, last]);
  ```

## 4. TypeScript strict

- `strict: true` dans `tsconfig.json`
- `noUncheckedIndexedAccess: true` → forces optional sur les accès `array[i]`
- `exactOptionalPropertyTypes: true` → distingue `undefined` et absence
- **Narrowing via type guards** custom quand discriminant union :
  ```ts
  function isCalendarEvent(item: TimelineItem): item is CalendarEvent {
    return item.source === 'gcal';
  }
  ```
- **Types vs Interfaces** : `type` par défaut. `interface` seulement pour les contrats implémentés par des classes (rares dans ce projet).

## 5. Imports

- **Alias `@/`** pour `src/`, configuré dans `tsconfig.json` et `vite.config.ts`
  ```ts
  // ❌
  import { BlockTile } from '../../../components/BlockTile';

  // ✅
  import { BlockTile } from '@/components/BlockTile';
  ```
- **Ordre imports** (géré par eslint) :
  1. Externes (react, libs)
  2. Internes alias `@/`
  3. Relatifs `./`
  4. Types (`import type`)
  5. CSS

## 6. Erreurs et async

- **Pas de `.then().catch()`** en chaîne. `async/await` + `try/catch`.
- **Erreurs typées** :
  ```ts
  class CalendarSyncError extends Error {
    constructor(message: string, public cause?: unknown) {
      super(message);
      this.name = 'CalendarSyncError';
    }
  }
  ```
- **Pas de `catch (e: any)`**. `catch (e: unknown)` + narrowing.

## 7. Tests

- Co-localisés : `foo.ts` + `foo.test.ts` dans le même dossier
- Vitest + @testing-library/react
- Pattern AAA : Arrange / Act / Assert, séparés par une ligne blanche
- Nommage `describe('<subject>', () => it('<behavior>'))`
- `userEvent` plutôt que `fireEvent` pour les interactions
- `screen.getByRole` > `getByTestId` quand possible (accessibilité validée au passage)

## 8. Structure d'un module typique

```
src/components/BlockTile/
  index.ts              → re-export named
  BlockTile.tsx         → composant
  BlockTile.test.tsx    → tests
  useBlockTile.ts       → hook si logique extractible
  types.ts              → types locaux au composant si nombreux
```

```ts
// index.ts
export { BlockTile } from './BlockTile';
export type { BlockTileProps } from './BlockTile';
```

## 9. Ce qu'on ne fait pas

- `React.memo` partout → seulement si profiler confirme un besoin
- `useCallback` systématique → pareil
- Composants de plus de 200 lignes → à découper
- Props booléennes qui s'accumulent (`isActive`, `isSelected`, `isDisabled`, `isHover`...) → envisager un `state: 'idle' | 'active' | 'selected'`
- Fichiers utilitaires fourre-tout (`utils.ts`, `helpers.ts`) → un fichier par domaine
