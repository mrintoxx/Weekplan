/**
 * Material 3 Design Tokens
 *
 * All theme values defined as CSS custom properties.
 * NEVER use hardcoded color values (hex, rgb, hsl) in components.
 * Always reference these tokens via var(--md-*) or var(--cat-*)
 */

export const materialTokens = {
  /* ===== COLOR PALETTE ===== */

  /* Primary */
  '--md-primary': 'hsl(210, 100%, 50%)',
  '--md-on-primary': 'hsl(0, 0%, 100%)',
  '--md-primary-container': 'hsl(210, 100%, 90%)',
  '--md-on-primary-container': 'hsl(210, 100%, 10%)',

  /* Secondary */
  '--md-secondary': 'hsl(190, 60%, 45%)',
  '--md-on-secondary': 'hsl(0, 0%, 100%)',
  '--md-secondary-container': 'hsl(190, 60%, 90%)',
  '--md-on-secondary-container': 'hsl(190, 60%, 10%)',

  /* Tertiary */
  '--md-tertiary': 'hsl(280, 50%, 50%)',
  '--md-on-tertiary': 'hsl(0, 0%, 100%)',
  '--md-tertiary-container': 'hsl(280, 50%, 90%)',
  '--md-on-tertiary-container': 'hsl(280, 50%, 10%)',

  /* Error */
  '--md-error': 'hsl(0, 72%, 51%)',
  '--md-on-error': 'hsl(0, 0%, 100%)',
  '--md-error-container': 'hsl(0, 72%, 90%)',
  '--md-on-error-container': 'hsl(0, 72%, 10%)',

  /* Surface */
  '--md-surface': 'hsl(220, 15%, 10%)', // Dark mode base
  '--md-surface-dim': 'hsl(220, 15%, 6%)',
  '--md-surface-bright': 'hsl(220, 15%, 18%)',
  '--md-surface-container-lowest': 'hsl(220, 15%, 4%)',
  '--md-surface-container-low': 'hsl(220, 15%, 8%)',
  '--md-surface-container': 'hsl(220, 15%, 12%)',
  '--md-surface-container-high': 'hsl(220, 15%, 16%)',
  '--md-surface-container-highest': 'hsl(220, 15%, 20%)',
  '--md-on-surface': 'hsl(220, 10%, 95%)',
  '--md-on-surface-variant': 'hsl(220, 10%, 75%)',
  '--md-outline': 'hsl(220, 10%, 35%)',
  '--md-outline-variant': 'hsl(220, 10%, 25%)',

  /* ===== BLOCK CATEGORIES ===== */

  /* Sport - energetic orange-red */
  '--cat-sport': 'hsl(15, 85%, 55%)',

  /* Rénovation - construction yellow */
  '--cat-reno': 'hsl(45, 90%, 55%)',

  /* Bébé - soft pink */
  '--cat-bebe': 'hsl(340, 75%, 65%)',

  /* Repos - calming blue */
  '--cat-repos': 'hsl(220, 70%, 60%)',

  /* Perso - neutral teal */
  '--cat-perso': 'hsl(180, 50%, 50%)',

  /* Travail - professional indigo */
  '--cat-travail': 'hsl(240, 60%, 55%)',

  /* Transition - muted gray-blue */
  '--cat-transition': 'hsl(200, 20%, 50%)',

  /* Homelab - tech green */
  '--cat-homelab': 'hsl(150, 60%, 45%)',

  /* Famille - warm purple */
  '--cat-famille': 'hsl(280, 50%, 60%)',

  /* ===== SHAPE (Border Radius) ===== */

  '--md-shape-none': '0',
  '--md-shape-xs': '4px',
  '--md-shape-sm': '8px',
  '--md-shape-md': '12px',
  '--md-shape-lg': '16px',
  '--md-shape-xl': '28px',
  '--md-shape-full': '9999px',

  /* ===== ELEVATION (Shadows) ===== */

  '--md-elevation-0': 'none',
  '--md-elevation-1': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
  '--md-elevation-2': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
  '--md-elevation-3': '0 4px 8px 3px rgb(0 0 0 / 0.15), 0 1px 3px 0 rgb(0 0 0 / 0.3)',
  '--md-elevation-4': '0 6px 10px 4px rgb(0 0 0 / 0.15), 0 2px 3px 0 rgb(0 0 0 / 0.3)',
  '--md-elevation-5': '0 8px 12px 6px rgb(0 0 0 / 0.15), 0 4px 4px 0 rgb(0 0 0 / 0.3)',

  /* ===== TYPOGRAPHY ===== */

  /* Display */
  '--md-font-display-lg': '400 57px/64px "Roboto Flex", system-ui, sans-serif',
  '--md-font-display-md': '400 45px/52px "Roboto Flex", system-ui, sans-serif',
  '--md-font-display-sm': '400 36px/44px "Roboto Flex", system-ui, sans-serif',

  /* Headline */
  '--md-font-headline-lg': '400 32px/40px "Roboto Flex", system-ui, sans-serif',
  '--md-font-headline-md': '400 28px/36px "Roboto Flex", system-ui, sans-serif',
  '--md-font-headline-sm': '400 24px/32px "Roboto Flex", system-ui, sans-serif',

  /* Title */
  '--md-font-title-lg': '400 22px/28px "Roboto Flex", system-ui, sans-serif',
  '--md-font-title-md': '500 16px/24px "Roboto Flex", system-ui, sans-serif',
  '--md-font-title-sm': '500 14px/20px "Roboto Flex", system-ui, sans-serif',

  /* Body */
  '--md-font-body-lg': '400 16px/24px "Roboto Flex", system-ui, sans-serif',
  '--md-font-body-md': '400 14px/20px "Roboto Flex", system-ui, sans-serif',
  '--md-font-body-sm': '400 12px/16px "Roboto Flex", system-ui, sans-serif',

  /* Label */
  '--md-font-label-lg': '500 14px/20px "Roboto Flex", system-ui, sans-serif',
  '--md-font-label-md': '500 12px/16px "Roboto Flex", system-ui, sans-serif',
  '--md-font-label-sm': '500 11px/16px "Roboto Flex", system-ui, sans-serif',

  /* ===== SPACING ===== */

  '--md-space-xs': '4px',
  '--md-space-sm': '8px',
  '--md-space-md': '16px',
  '--md-space-lg': '24px',
  '--md-space-xl': '32px',
  '--md-space-2xl': '48px',
} as const;

/**
 * Inject all tokens into :root as CSS custom properties
 * Called once at app initialization
 */
export function injectThemeTokens(): void {
  const root = document.documentElement;
  Object.entries(materialTokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
