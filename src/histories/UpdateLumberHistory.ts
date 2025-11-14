import type { Lumber } from '../types/lumber';
import { useLumberStore } from '../stores/lumber';
import type { HistoryBase } from './HistoryBase';

export class UpdateLumberHistory implements HistoryBase {
  constructor(
    private lumberId: string,
    private prevState: Partial<Lumber>,
    private nextState: Partial<Lumber>
  ) {}

  undo() {
    useLumberStore.getState().updateLumber(this.lumberId, this.prevState);
  }

  redo() {
    useLumberStore.getState().updateLumber(this.lumberId, this.nextState);
  }
}
