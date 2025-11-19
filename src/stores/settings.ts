import { create } from 'zustand';

interface SettingsStoreState {
  gridSize: number;           // グリッドサイズ（mm）
  snapToGrid: boolean;        // グリッドスナップ有効/無効
  snapThreshold: number;      // スナップ閾値（mm）
  contactThreshold: number;   // 接触判定閾値（mm）
  workAreaSize: number;       // 作業エリアサイズ（mm）

  setGridSize: (size: number) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setSnapThreshold: (threshold: number) => void;
  setContactThreshold: (threshold: number) => void;
  setWorkAreaSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsStoreState>()((set) => ({
  gridSize: 100,              // 100mm = 10cm
  snapToGrid: true,
  snapThreshold: 5,           // 5mm以内でスナップ
  contactThreshold: 1.0,      // 1mm以内で接触とみなす
  workAreaSize: 10000,        // 10000mm = 10m

  setGridSize: (size) => set({ gridSize: size }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setSnapThreshold: (threshold) => set({ snapThreshold: threshold }),
  setContactThreshold: (threshold) => set({ contactThreshold: threshold }),
  setWorkAreaSize: (size) => set({ workAreaSize: size }),
}));
