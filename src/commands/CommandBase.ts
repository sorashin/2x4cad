import type { HistoryBase } from "../histories/HistoryBase";

/**
 * Abstract base class for all commands
 * Each command represents a reversible action in the application
 */
export abstract class CommandBase implements HistoryBase {
  /**
   * Human-readable name of the command
   */
  abstract readonly name: string;

  /**
   * Timestamp when the command was created
   */
  readonly timestamp: number;

  constructor() {
    this.timestamp = Date.now();
  }

  /**
   * Undo the command
   */
  abstract undo(): void;

  /**
   * Redo the command (reapply changes)
   */
  abstract redo(): void;

  /**
   * Get a human-readable description of the command
   */
  getDescription(): string {
    return this.name;
  }
}
