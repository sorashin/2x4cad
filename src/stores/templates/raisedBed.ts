import { create } from 'zustand';

interface RaisedBedStore {
  width: number;
  height: number;
  depth: number;
  sideBoard: [number, number];
  bottomBoard: [number, number];
  post: [number, number];
  footBoard: [number, number];

  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setDepth: (depth: number) => void;
  setSideBoard: (sideBoard: [number, number]) => void;
  setBottomBoard: (bottomBoard: [number, number]) => void;
  setPost: (post: [number, number]) => void;
  setFootBoard: (footBoard: [number, number]) => void;
}

export const useRaisedBedStore = create<RaisedBedStore>((set) => ({
  // 初期値
  width: 1200,
  height: 300,
  depth: 680,
  sideBoard: [89, 19],
  bottomBoard: [89, 38],
  post: [45, 45],
  footBoard: [20, 89],

  // アクション
  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
  setDepth: (depth) => set({ depth }),
  setSideBoard: (sideBoard) => set({ sideBoard }),
  setBottomBoard: (bottomBoard) => set({ bottomBoard }),
  setPost: (post) => set({ post }),
  setFootBoard: (footBoard) => set({ footBoard }),
}));
