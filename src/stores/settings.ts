import { create } from 'zustand';

// 利用可能なグリッドサイズ（mm）
export const GRID_SIZE_OPTIONS = [1, 10, 100] as const;
export type GridSizeOption = typeof GRID_SIZE_OPTIONS[number];

interface SettingsStoreState {
  gridSize: GridSizeOption;   // グリッドサイズ（mm）: 1, 10, 100
  snapToGrid: boolean;        // グリッドスナップ有効/無効
  contactThreshold: number;   // 接触判定閾値（mm）
  workAreaSize: number;       // 作業エリアサイズ（mm）

  setGridSize: (size: GridSizeOption) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setContactThreshold: (threshold: number) => void;
  setWorkAreaSize: (size: number) => void;
  cycleGridSize: () => void;  // グリッドサイズを切り替える
}

export const useSettingsStore = create<SettingsStoreState>()((set, get) => ({
  gridSize: 100,              // デフォルト: 100mm
  snapToGrid: true,
  contactThreshold: 1.0,      // 1mm以内で接触とみなす
  workAreaSize: 10000,        // 10000mm = 10m

  setGridSize: (size) => set({ gridSize: size }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setContactThreshold: (threshold) => set({ contactThreshold: threshold }),
  setWorkAreaSize: (size) => set({ workAreaSize: size }),
  
  // グリッドサイズを切り替える（100 → 10 → 1 → 100...）
  cycleGridSize: () => {
    const current = get().gridSize;
    const currentIndex = GRID_SIZE_OPTIONS.indexOf(current);
    const nextIndex = (currentIndex + 1) % GRID_SIZE_OPTIONS.length;
    set({ gridSize: GRID_SIZE_OPTIONS[nextIndex] });
  },
}));
