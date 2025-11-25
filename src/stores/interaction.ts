import { create } from 'zustand';
import type { Vector3 } from '../types/lumber';
import { LumberType } from '../types/lumber';
import type { ParallelFaceInfo } from '../utils/geometry';


//一時的に保持するデータを管理するストア
interface InteractionStoreState {
  // Start point for lumber placement (in mm)
  startPoint: Vector3 | null;

  // Current mouse position in 3D space (in mm)
  currentMousePosition: Vector3 | null;

  // Selected lumber type for new placement
  selectedLumberType: LumberType;

  // 面スナップ関連
  parallelFaces: ParallelFaceInfo[]; // 平行な面のリスト（ハイライト用）
  activeSnapFace: ParallelFaceInfo | null; // スナップ中の面（閾値内で最も近い面）

  // Actions
  setStartPoint: (point: Vector3 | null) => void;
  setCurrentMousePosition: (point: Vector3 | null) => void;
  setSelectedLumberType: (type: LumberType) => void;
  setParallelFaces: (faces: ParallelFaceInfo[]) => void;
  setActiveSnapFace: (face: ParallelFaceInfo | null) => void;
  clearPlacement: () => void;
}

export const useInteractionStore = create<InteractionStoreState>()((set) => ({
  startPoint: null,
  currentMousePosition: null,
  selectedLumberType: LumberType.TWO_BY_FOUR,
  parallelFaces: [],
  activeSnapFace: null,

  setStartPoint: (point) => {
    set({ startPoint: point });
  },

  setCurrentMousePosition: (point) => {
    set({ currentMousePosition: point });
  },

  setSelectedLumberType: (type) => {
    set({ selectedLumberType: type });
  },

  setParallelFaces: (faces) => {
    set({ parallelFaces: faces });
  },

  setActiveSnapFace: (face) => {
    set({ activeSnapFace: face });
  },

  clearPlacement: () => {
    set({ 
      startPoint: null, 
      currentMousePosition: null,
      parallelFaces: [],
      activeSnapFace: null,
    });
  },
}));
