import type { DayTemplate } from '@/types';
import { saveTemplate, deleteTemplate as dbDeleteTemplate, getAllTemplates } from '@/store/persistence';
import { DEFAULT_DAY_TEMPLATES } from '@/constants/templates';

export type TemplatesSlice = {
  templates: DayTemplate[];
  addTemplate: (template: DayTemplate) => void;
  updateTemplate: (template: DayTemplate) => void;
  deleteTemplate: (id: string) => void;
  resetToDefaults: () => void;
};

type BoundState = TemplatesSlice;

export function createTemplatesSlice(
  set: (fn: (state: BoundState) => void) => void,
  _get: () => BoundState,
): TemplatesSlice {
  return {
    templates: [],

    addTemplate(template) {
      set((state) => {
        state.templates.push(template);
      });
      void saveTemplate(template);
    },

    updateTemplate(template) {
      set((state) => {
        const idx = state.templates.findIndex((t) => t.id === template.id);
        if (idx !== -1) state.templates.splice(idx, 1, template);
      });
      void saveTemplate(template);
    },

    deleteTemplate(id) {
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id);
      });
      void dbDeleteTemplate(id);
    },

    resetToDefaults() {
      set((state) => {
        state.templates = [...DEFAULT_DAY_TEMPLATES];
      });
      for (const t of DEFAULT_DAY_TEMPLATES) {
        void saveTemplate(t);
      }
    },
  };
}

export async function loadTemplatesFromDB(): Promise<DayTemplate[]> {
  return getAllTemplates();
}
