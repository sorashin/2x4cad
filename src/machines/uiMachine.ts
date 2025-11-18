import { setup } from "xstate";

// Define UI modes
export type UIMode = "idle" | "lumber_placing_start" | "lumber_placing_end";

// Define the events
export type UIMachineEvent =
  | { type: "ENTER_IDLE_MODE" }
  | { type: "START_ADD_LUMBER" }
  | { type: "PLACE_START_POINT" }
  | { type: "PLACE_END_POINT" }
  | { type: "CANCEL_ADD_LUMBER" };

/**
 * UI State Machine - manages only mode transitions for lumber placement
 * All data management is handled by Zustand stores (useLumberStore, useInteractionStore)
 *
 * States:
 * - idle: Normal mode, no active placement
 * - lumber_placing_start: Waiting for first click to set start point
 * - lumber_placing_end: Waiting for second click to set end point
 */
export const uiMachine = setup({
  types: {
    context: {} as {}, // No context - XState only manages mode transitions
    events: {} as UIMachineEvent,
  },
}).createMachine({
  id: "ui",
  initial: "idle",
  context: {},
  states: {
    idle: {
      on: {
        START_ADD_LUMBER: "lumber_placing_start",
      },
    },
    lumber_placing_start: {
      on: {
        PLACE_START_POINT: "lumber_placing_end",
        CANCEL_ADD_LUMBER: "idle",
        ENTER_IDLE_MODE: "idle",
      },
    },
    lumber_placing_end: {
      on: {
        PLACE_END_POINT: "idle",
        CANCEL_ADD_LUMBER: "idle",
        ENTER_IDLE_MODE: "idle",
      },
    },
  },
});
