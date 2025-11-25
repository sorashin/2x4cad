import type { HistoryBase } from './HistoryBase';

export class NestedHistory implements HistoryBase {
  private histories: HistoryBase[];

  constructor(histories: HistoryBase[]) {
    this.histories = histories;
  }

  getHistories() {
    return this.histories;
  }

  undo() {
    // 逆順でundo
    for (let i = this.histories.length - 1; i >= 0; i--) {
      this.histories[i].undo();
    }
  }

  redo() {
    // 順番にredo
    for (let i = 0; i < this.histories.length; i++) {
      this.histories[i].redo();
    }
  }
}
