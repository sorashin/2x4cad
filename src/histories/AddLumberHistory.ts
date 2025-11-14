import type { Lumber } from '../types/lumber';
import { useLumberStore } from '../stores/lumber';
import type { HistoryBase } from './HistoryBase';

export class AddLumberHistory implements HistoryBase {
  private lumberData: Lumber | null = null;

  constructor(private lumberId: string) {}

  undo() {
    const store = useLumberStore.getState();
    // 削除前にデータをバックアップ
    this.lumberData = store.lumbers[this.lumberId];
    store.deleteLumber(this.lumberId);
  }

  redo() {
    if (this.lumberData) {
      const store = useLumberStore.getState();
      store.restoreLumber(this.lumberData);
    }
  }
}
