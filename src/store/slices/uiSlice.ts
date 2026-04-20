import { weekStartOf, formatISODate } from '@/lib/datetime';
import dayjs from 'dayjs';

export type UiSlice = {
  selectedDate: string;
  selectedWeekStart: string;
  activeModal: string | null;
  setSelectedDate: (date: string) => void;
  setSelectedWeekStart: (weekStart: string) => void;
  setActiveModal: (modal: string) => void;
  closeModal: () => void;
};

type BoundState = UiSlice;

export function createUiSlice(
  set: (fn: (state: BoundState) => void) => void,
  _get: () => BoundState,
): UiSlice {
  const today = dayjs();
  const todayStr = formatISODate(today);
  const weekStartStr = formatISODate(weekStartOf(today));

  return {
    selectedDate: todayStr,
    selectedWeekStart: weekStartStr,
    activeModal: null,

    setSelectedDate(date) {
      set((state) => { state.selectedDate = date; });
    },

    setSelectedWeekStart(weekStart) {
      set((state) => { state.selectedWeekStart = weekStart; });
    },

    setActiveModal(modal) {
      set((state) => { state.activeModal = modal; });
    },

    closeModal() {
      set((state) => { state.activeModal = null; });
    },
  };
}
