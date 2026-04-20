import type { DayTemplate } from '@/types';

const offTemplate: DayTemplate = {
  id: 'off',
  label: 'Jour off',
  blocks: [
    { id: 'off-lever', label: 'Lever', category: 'perso', start: '07:00', duration: 30 },
    { id: 'off-sport', label: 'Sport', category: 'sport', start: '07:30', duration: 90 },
    { id: 'off-reno-1', label: 'Réno bloc 1', category: 'reno', start: '09:30', duration: 210 },
    { id: 'off-dejeuner', label: 'Déjeuner', category: 'famille', start: '13:00', duration: 45 },
    { id: 'off-reno-2', label: 'Réno bloc 2', category: 'reno', start: '15:15', duration: 135 },
    { id: 'off-famille', label: 'Famille', category: 'famille', start: '17:30', duration: 210 },
    { id: 'off-homelab', label: 'Homelab', category: 'homelab', start: '21:00', duration: 60 },
    { id: 'off-coucher', label: 'Coucher', category: 'repos', start: '22:00', duration: 15, fixed: true },
  ],
};

const preNightTemplate: DayTemplate = {
  id: 'pre-night',
  label: 'Pré-nuit',
  autoDetect: { titlePattern: 'nuit' },
  blocks: [
    { id: 'pre-night-lever', label: 'Lever', category: 'perso', start: '09:00', duration: 30 },
    { id: 'pre-night-perso', label: 'Perso', category: 'perso', start: '09:30', duration: 90 },
    {
      id: 'pre-night-sport-reno',
      label: 'Sport ou Réno',
      category: 'sport',
      start: '11:00',
      duration: 150,
      notes: 'sport OU réno au choix',
    },
    { id: 'pre-night-dejeuner', label: 'Déjeuner', category: 'famille', start: '13:30', duration: 45 },
    { id: 'pre-night-transition', label: 'Transition', category: 'transition', start: '15:00', duration: 120 },
    { id: 'pre-night-repas', label: 'Repas', category: 'famille', start: '17:00', duration: 60 },
    { id: 'pre-night-depart', label: 'Départ shift', category: 'transition', start: '18:30', duration: 30, fixed: true },
    {
      id: 'pre-night-shift-nuit',
      label: 'Shift nuit',
      category: 'travail',
      start: '19:00',
      duration: 720,
      fixed: true,
    },
  ],
};

const postNightTemplate: DayTemplate = {
  id: 'post-night',
  label: 'Post-nuit',
  blocks: [
    { id: 'post-night-retour', label: 'Retour', category: 'transition', start: '07:00', duration: 30, fixed: true },
    { id: 'post-night-manger', label: 'Manger', category: 'famille', start: '08:00', duration: 30 },
    { id: 'post-night-sommeil', label: 'Sommeil', category: 'repos', start: '08:30', duration: 330, fixed: true },
    { id: 'post-night-reveil', label: 'Réveil progressif', category: 'perso', start: '14:00', duration: 105 },
    { id: 'post-night-taches', label: 'Tâches légères', category: 'perso', start: '15:45', duration: 75 },
    { id: 'post-night-famille', label: 'Famille', category: 'famille', start: '17:00', duration: 240 },
    { id: 'post-night-coucher', label: 'Coucher', category: 'repos', start: '21:00', duration: 15, fixed: true },
  ],
};

const workTemplate: DayTemplate = {
  id: 'work',
  label: 'Travail',
  autoDetect: { titlePattern: 'jour' },
  blocks: [
    { id: 'work-lever', label: 'Lever', category: 'perso', start: '04:00', duration: 30, fixed: true },
    { id: 'work-perso', label: 'Perso', category: 'perso', start: '04:30', duration: 75 },
    { id: 'work-depart', label: 'Départ shift', category: 'transition', start: '05:45', duration: 75, fixed: true },
    { id: 'work-shift-jour', label: 'Shift jour', category: 'travail', start: '07:00', duration: 720, fixed: true },
    { id: 'work-retour', label: 'Retour', category: 'transition', start: '19:00', duration: 60, fixed: true },
    { id: 'work-famille', label: 'Famille', category: 'famille', start: '20:00', duration: 90 },
    { id: 'work-coucher', label: 'Coucher', category: 'repos', start: '21:30', duration: 15, fixed: true },
  ],
};

export const DEFAULT_DAY_TEMPLATES: DayTemplate[] = [
  offTemplate,
  preNightTemplate,
  postNightTemplate,
  workTemplate,
];
