import { CommandBase } from "./CommandBase";
import { useLumberStore } from "../stores/lumber";
import { useHistoryStore } from "../stores/history";
import type { Lumber } from "../types/lumber";

/**
 * Command to delete selected lumbers from the scene
 * Handles multiple lumber deletion and history management
 */
export class DeleteLumberCommand extends CommandBase {
  readonly name = "Delete Lumber";
  private lumberIds: string[];
  private lumberDataMap: Map<string, Lumber> = new Map();

  constructor(lumberIds: string[]) {
    super();
    this.lumberIds = [...lumberIds]; // Copy array to avoid mutation
  }

  /**
   * Execute the command - deletes lumbers and pushes to history
   */
  execute(): void {
    const store = useLumberStore.getState();
    
    // Backup data before deletion
    this.lumberDataMap.clear();
    for (const id of this.lumberIds) {
      const lumber = store.lumbers[id];
      if (lumber) {
        this.lumberDataMap.set(id, { ...lumber });
      }
    }

    // Delete all selected lumbers
    for (const id of this.lumberIds) {
      store.deleteLumber(id);
    }

    // Push to history
    const historyStore = useHistoryStore.getState();
    historyStore.push(this);
  }

  undo(): void {
    const store = useLumberStore.getState();
    
    // Restore all deleted lumbers
    for (const [id, lumber] of this.lumberDataMap.entries()) {
      store.restoreLumber(lumber);
    }
  }

  redo(): void {
    const store = useLumberStore.getState();
    
    // Delete all lumbers again
    for (const id of this.lumberIds) {
      store.deleteLumber(id);
    }
  }

  getDescription(): string {
    const count = this.lumberIds.length;
    if (count === 1) {
      return `${this.name} (1 item)`;
    }
    return `${this.name} (${count} items)`;
  }
}

