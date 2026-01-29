import { create } from 'zustand';
import type { LumberType } from '../../types/lumber';

// 部材定義の元データ（単一の真実の源）
const DEFAULT_BOARDS = [
  {
    name: 'sideBoard',
    type: '1x4' as LumberType,
    size: [89, 19] as [number, number]
  },
  {
    name: 'bottomBoard',
    type: '2x4' as LumberType,
    size: [89, 38] as [number, number]
  },
  {
    name: 'post',
    type: 'rafter' as LumberType,
    size: [45, 45] as [number, number]
  },
  {
    name: 'footBoard',
    type: '1x4' as LumberType,
    size: [20, 89] as [number, number]
  }
] as const;

/**
 * RaisedBedテンプレートで使用する部材名ラベルを取得
 * @returns 部材名の配列（readonly）
 */
export const getBoardLabels = () => {
  return DEFAULT_BOARDS.map(b => b.name);
};

/**
 * RaisedBedの部材ラベルの型
 */
export type RaisedBedBoardLabel = ReturnType<typeof getBoardLabels>[number];

interface RaisedBedStore {
  width: number;
  height: number;
  depth: number;
  boards: {
    name: string;
    type: LumberType;
    size: [number, number];
  }[];

  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setDepth: (depth: number) => void;
  setBoards: (boards: { name: string; type: LumberType; size: [number, number] }[]) => void;
}

export const useRaisedBedStore = create<RaisedBedStore>((set) => ({
  // 初期値
  width: 1200,
  height: 300,
  depth: 680,
  boards: DEFAULT_BOARDS.map(b => ({ ...b })),

  // アクション
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
  setDepth: (depth) => set({ depth }),
  setBoards: (boards) => set({ boards })
}));
