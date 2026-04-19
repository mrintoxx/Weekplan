---
name: material-tokens
description: Tokens de design Material 3 du projet. À consulter avant tout choix de couleur, espacement, radius ou ombre. Interdit d'utiliser des valeurs en dur.
---

# Material 3 Tokens

Tous les tokens sont exposés en CSS variables sur `:root`. Consommés via Tailwind arbitrary values ou classes personnalisées.

## Règle absolue

**Aucune couleur hexa, RGB, HSL en dur dans le code.** Jamais. Si le token manque, on l'ajoute dans `constants/theme.ts`, on documente, puis on l'utilise.

## Tokens disponibles

### Palette (Material 3)

```css
:root {
  /* Primary */
  --md-primary: hsl(...);
  --md-on-primary: hsl(...);
  --md-primary-container: hsl(...);
  --md-on-primary-container: hsl(...);

  /* Secondary, Tertiary, Error : même structure */

  /* Surface */
  --md-surface: hsl(...);
  --md-surface-dim: hsl(...);
  --md-surface-bright: hsl(...);
  --md-surface-container-lowest: hsl(...);
  --md-surface-container-low: hsl(...);
  --md-surface-container: hsl(...);
  --md-surface-container-high: hsl(...);
  --md-surface-container-highest: hsl(...);
  --md-on-surface: hsl(...);
  --md-on-surface-variant: hsl(...);
  --md-outline: hsl(...);
  --md-outline-variant: hsl(...);
}
```

### Couleurs catégories (blocs)

Chaque `BlockCategory` a son token de couleur accent :

```css
:root {
  --cat-sport: hsl(...);
  --cat-reno: hsl(...);
  --cat-bebe: hsl(...);
  --cat-repos: hsl(...);
  --cat-perso: hsl(...);
  --cat-travail: hsl(...);
  --cat-transition: hsl(...);
  --cat-homelab: hsl(...);
  --cat-famille: hsl(...);
}
```

Définies dans `src/constants/theme.ts`, valeurs choisies pour contrastes WCAG AA sur surface.

### Shape (border radius)

```css
--md-shape-none: 0;
--md-shape-xs: 4px;
--md-shape-sm: 8px;
--md-shape-md: 12px;
--md-shape-lg: 16px;
--md-shape-xl: 28px;
--md-shape-full: 9999px;
```

Règle projet : blocs = `md`, tiles events = `md`, cards config = `lg`, chips = `full`.

### Elevation (ombres)

```css
--md-elevation-0: none;
--md-elevation-1: ...;
--md-elevation-2: ...;
--md-elevation-3: ...;
--md-elevation-4: ...;
--md-elevation-5: ...;
```

Règle projet : blocs au repos `elevation-1`, hover `elevation-2`, pendant drag `elevation-4`.

### Typography

Roboto Flex ou équivalent système. Échelle Material :

```css
--md-font-display-lg: ...;
--md-font-headline-lg: ...;
--md-font-title-lg / md / sm: ...;
--md-font-body-lg / md / sm: ...;
--md-font-label-lg / md / sm: ...;
```

## Usage

### En Tailwind

```tsx
// ✅
<div className="bg-[var(--md-surface-container)] text-[var(--md-on-surface)] rounded-[var(--md-shape-md)]">
```

### En CSS module

```css
.tile {
  background: var(--cat-sport);
  border-radius: var(--md-shape-md);
  box-shadow: var(--md-elevation-1);
}
```

### Interdit

```tsx
// ❌ couleur hexa
<div className="bg-[#3b82f6]" />

// ❌ classe Tailwind palette arbitraire
<div className="bg-blue-500" />

// ❌ valeur en dur
<div style={{ borderRadius: '12px' }} />
```

## Dégradés

Règle projet : dégradé léger autorisé sur les tiles de blocs. Construit toujours à partir de deux tokens d'un même champ, pas de couleurs inventées.

```css
background: linear-gradient(
  135deg,
  var(--cat-sport) 0%,
  color-mix(in oklch, var(--cat-sport), var(--md-surface) 20%) 100%
);
```

## Dark / Light

V1 : dark mode uniquement (préférence utilisateur exprimée).
V6+ : token set `light` et `dark`, switch via `[data-theme]` sur `<html>`.

## Ajouter un token

1. Justifier le besoin : aucun token existant ne couvre le cas
2. Ajouter dans `constants/theme.ts` avec commentaire sur son usage prévu
3. Définir light et dark
4. Mettre à jour ce skill avec le nouveau token
5. Commit `feat(theme): add <nom-token>`
