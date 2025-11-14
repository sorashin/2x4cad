import { create } from 'zustand';

interface SettingsStoreState {
  gridSize: number;           // グリッドサイズ（mm）
  snapToGrid: boolean;        // グリッドスナップ有効/無効
  snapThreshold: number;      // スナップ閾値（mm）
  contactThreshold: number;   // 接触判定閾値（mm）

  setGridSize: (size: number) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setSnapThreshold: (threshold: number) => void;
  setContactThreshold: (threshold: number) => void;
}

export const useSettingsStore = create<SettingsStoreState>()((set) => ({
  gridSize: 100,              // 100mm = 10cm
  snapToGrid: true,
  snapThreshold: 5,           // 5mm以内でスナップ
  contactThreshold: 1.0,      // 1mm以内で接触とみなす

  setGridSize: (size) => set({ gridSize: size }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setSnapThreshold: (threshold) => set({ snapThreshold: threshold }),
  setContactThreshold: (threshold) => set({ contactThreshold: threshold }),
}));
