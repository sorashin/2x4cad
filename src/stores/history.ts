import { create } from 'zustand';
import type { HistoryBase } from '../histories/HistoryBase';

interface HistoryState {
  currentIndex: number;
  histories: HistoryBase[];
}

export interface HistoryStoreState {
  historyState: HistoryState;
  push: (history: HistoryBase) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStoreState>()((set, get) => ({
  historyState: {
    currentIndex: -1,
    histories: [],
  },

  push: (history: HistoryBase) => {
    const { historyState } = get();
    const { histories, currentIndex } = historyState;
    // 現在位置より後の履歴を削除
    const remain = histories.slice(0, currentIndex + 1);
    set({
      historyState: {
        histories: [...remain, history],
        currentIndex: remain.length,
      },
    });
  },

  undo: () => {
    const { historyState } = get();
    const { histories, currentIndex } = historyState;
    if (currentIndex < 0) {
      return;
    }
    const history = histories[currentIndex];
    history.undo();
    set({
      historyState: {
        histories,
        currentIndex: currentIndex - 1,
      },
    });
  },

  redo: () => {
    const { historyState } = get();
    const { histories, currentIndex } = historyState;
    if (currentIndex >= histories.length - 1) {
      return;
    }
    const history = histories[currentIndex + 1];
    history.redo();
    set({
      historyState: {
        histories,
        currentIndex: currentIndex + 1,
      },
    });
  },

  clear: () => {
    set({
      historyState: {
        currentIndex: -1,
        histories: [],
      },
    });
  },
}));
