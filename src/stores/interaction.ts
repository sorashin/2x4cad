import { create } from 'zustand';
import type { Vector3 } from '../types/lumber';
import { LumberType } from '../types/lumber';


//一時的に保持するデータを管理するストア
interface InteractionStoreState {
  // Start point for lumber placement (in mm)
  startPoint: Vector3 | null;

  // Current mouse position in 3D space (in mm)
  currentMousePosition: Vector3 | null;

  // Selected lumber type for new placement
  selectedLumberType: LumberType;

  // Actions
  setStartPoint: (point: Vector3 | null) => void;
  setCurrentMousePosition: (point: Vector3 | null) => void;
  setSelectedLumberType: (type: LumberType) => void;
  clearPlacement: () => void;
}

export const useInteractionStore = create<InteractionStoreState>()((set) => ({
  startPoint: null,
  currentMousePosition: null,
  selectedLumberType: LumberType.TWO_BY_FOUR,

  setStartPoint: (point) => {
    set({ startPoint: point });
  },

  setCurrentMousePosition: (point) => {
    set({ currentMousePosition: point });
  },

  setSelectedLumberType: (type) => {
    set({ selectedLumberType: type });
  },

  clearPlacement: () => {
    set({ startPoint: null, currentMousePosition: null });
  },
}));
