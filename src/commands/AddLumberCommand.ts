import { CommandBase } from "./CommandBase";
import { useLumberStore } from "../stores/lumber";
import { useHistoryStore } from "../stores/history";
import type { Lumber, Vector3 } from "../types/lumber";
import { LumberType } from "../types/lumber";

/**
 * Command to add a lumber to the scene
 * Handles axis-aligned snapping and history management
 */
export class AddLumberCommand extends CommandBase {
  readonly name = "Add Lumber";
  private lumberId: string | null = null;
  private lumberData: Lumber | null = null;
  private type: LumberType;
  private start: Vector3;
  private end: Vector3;

  constructor(type: LumberType, start: Vector3, end: Vector3) {
    super();
    this.type = type;

    // Snap end point to closest axis-aligned direction
    const snappedEnd = this.snapToAxis(start, end);
    this.start = start;
    this.end = snappedEnd;
  }

  /**
   * Execute the command - adds lumber and pushes to history
   */
  execute(): string {
    const store = useLumberStore.getState();
    this.lumberId = store.addLumber(this.type, this.start, this.end);

    // Push to history
    const historyStore = useHistoryStore.getState();
    historyStore.push(this);

    return this.lumberId;
  }

  /**
   * Snap end point to the closest X/Y/Z axis direction from start
   */
  private snapToAxis(start: Vector3, end: Vector3): Vector3 {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const dz = Math.abs(end.z - start.z);

    // Find the dominant axis
    if (dx >= dy && dx >= dz) {
      // X axis is dominant
      return { x: end.x, y: start.y, z: start.z };
    } else if (dy >= dx && dy >= dz) {
      // Y axis is dominant
      return { x: start.x, y: end.y, z: start.z };
    } else {
      // Z axis is dominant
      return { x: start.x, y: start.y, z: end.z };
    }
  }

  undo(): void {
    if (this.lumberId) {
      const store = useLumberStore.getState();
      // Backup data before delete
      this.lumberData = store.lumbers[this.lumberId];
      store.deleteLumber(this.lumberId);
    }
  }

  redo(): void {
    if (this.lumberData) {
      const store = useLumberStore.getState();
      store.restoreLumber(this.lumberData);
    }
  }

  getDescription(): string {
    const length = Math.sqrt(
      Math.pow(this.end.x - this.start.x, 2) +
      Math.pow(this.end.y - this.start.y, 2) +
      Math.pow(this.end.z - this.start.z, 2)
    );
    return `${this.name} (${this.type}, ${Math.round(length)}mm)`;
  }
}
