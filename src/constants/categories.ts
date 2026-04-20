import type { BlockCategory } from '@/types';

export type CategoryConfig = {
  label: string;
  colorToken: string;
  icon: string;
  defaultDuration: number;
  allowOverlap: boolean;
};

export const CATEGORY_CONFIG: Record<BlockCategory, CategoryConfig> = {
  sport: {
    label: 'Sport',
    colorToken: '--cat-sport',
    icon: 'Dumbbell',
    defaultDuration: 60,
    allowOverlap: false,
  },
  reno: {
    label: 'Rénovation',
    colorToken: '--cat-reno',
    icon: 'Hammer',
    defaultDuration: 120,
    allowOverlap: false,
  },
  bebe: {
    label: 'Bébé',
    colorToken: '--cat-bebe',
    icon: 'Baby',
    defaultDuration: 60,
    allowOverlap: true,
  },
  repos: {
    label: 'Repos',
    colorToken: '--cat-repos',
    icon: 'Moon',
    defaultDuration: 60,
    allowOverlap: false,
  },
  perso: {
    label: 'Personnel',
    colorToken: '--cat-perso',
    icon: 'User',
    defaultDuration: 30,
    allowOverlap: false,
  },
  travail: {
    label: 'Travail',
    colorToken: '--cat-travail',
    icon: 'Briefcase',
    defaultDuration: 480,
    allowOverlap: false,
  },
  transition: {
    label: 'Transition',
    colorToken: '--cat-transition',
    icon: 'ArrowRight',
    defaultDuration: 15,
    allowOverlap: false,
  },
  homelab: {
    label: 'Homelab',
    colorToken: '--cat-homelab',
    icon: 'Server',
    defaultDuration: 60,
    allowOverlap: false,
  },
  famille: {
    label: 'Famille',
    colorToken: '--cat-famille',
    icon: 'Heart',
    defaultDuration: 60,
    allowOverlap: true,
  },
};
