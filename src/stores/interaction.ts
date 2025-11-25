import { create } from 'zustand';
import type { Vector3, Face, Quaternion } from '../types/lumber';
import { LumberType, FaceType } from '../types/lumber';
import type { ParallelFaceInfo } from '../utils/geometry';

// Surface Snap用の情報
export interface SurfaceSnapInfo {
  face: Face;
  lumberId: string;
  normal: Vector3;
  rotation: Quaternion; // 新しいLumberの回転（角を合わせるため）
  faceType: FaceType;   // 面の種類
  isRotated90: boolean;  // 自動90度回転が適用されたか
}

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

  // Surface Snap関連（始点選択時）
  hoveredFaceInfo: SurfaceSnapInfo | null; // マウス下の面情報
  lockedFaceSnap: SurfaceSnapInfo | null; // Phase 1からPhase 2に渡す固定スナップ情報

  // Actions
  setStartPoint: (point: Vector3 | null) => void;
  setCurrentMousePosition: (point: Vector3 | null) => void;
  setSelectedLumberType: (type: LumberType) => void;
  setParallelFaces: (faces: ParallelFaceInfo[]) => void;
  setActiveSnapFace: (face: ParallelFaceInfo | null) => void;
  setHoveredFaceInfo: (info: SurfaceSnapInfo | null) => void;
  setLockedFaceSnap: (info: SurfaceSnapInfo | null) => void;
  clearPlacement: () => void;
}

export const useInteractionStore = create<InteractionStoreState>()((set) => ({
  startPoint: null,
  currentMousePosition: null,
  selectedLumberType: LumberType.TWO_BY_FOUR,
  parallelFaces: [],
  activeSnapFace: null,
  hoveredFaceInfo: null,
  lockedFaceSnap: null,

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

  setHoveredFaceInfo: (info) => {
    set({ hoveredFaceInfo: info });
  },

  setLockedFaceSnap: (info) => {
    set({ lockedFaceSnap: info });
  },

  clearPlacement: () => {
    set({ 
      startPoint: null, 
      currentMousePosition: null,
      parallelFaces: [],
      activeSnapFace: null,
      hoveredFaceInfo: null,
      lockedFaceSnap: null,
    });
  },
}));
