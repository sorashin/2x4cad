import { useSelector } from "@xstate/react";
import { useUIMachineActor } from "../contexts/UIMachineContext";
import { useInteractionStore } from "../stores/interaction";
import type { UIMode } from "../machines/uiMachine";
import type { Vector3 } from "../types/lumber";
import { useEffect, useRef } from "react";
import { AddLumberCommand } from "../commands/AddLumberCommand";

export function useUIMode() {
  const actor = useUIMachineActor();
  const state = useSelector(actor, (snapshot) => snapshot);
  const currentMode = state.value as UIMode;

  // Get data from Zustand stores
  const startPoint = useInteractionStore((s) => s.startPoint);
  const currentMousePosition = useInteractionStore((s) => s.currentMousePosition);
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const setStartPoint = useInteractionStore((s) => s.setStartPoint);
  const setCurrentMousePosition = useInteractionStore((s) => s.setCurrentMousePosition);
  const setSelectedLumberType = useInteractionStore((s) => s.setSelectedLumberType);
  const clearPlacement = useInteractionStore((s) => s.clearPlacement);

  // Auto-cleanup: Clear temporary data when leaving lumber placement mode
  const prevModeRef = useRef(currentMode);
  useEffect(() => {
    const prevMode = prevModeRef.current;

    // Clear placement data when transitioning to idle from any placement mode
    if (
      prevMode !== "idle" &&
      currentMode === "idle"
    ) {
      clearPlacement();
    }

    prevModeRef.current = currentMode;
  }, [currentMode, clearPlacement]);

  return {
    // ========== Current Mode ==========
    currentMode,

    // ========== Data (from Zustand) ==========
    startPoint,
    currentMousePosition,
    selectedLumberType,

    // ========== Data Setters ==========
    setCurrentMousePosition,
    setSelectedLumberType,

    // ========== Mode Transitions (XState) ==========
    enterIdleMode: () => actor.send({ type: "ENTER_IDLE_MODE" }),
    startAddLumber: () => actor.send({ type: "START_ADD_LUMBER" }),
    cancelAddLumber: () => actor.send({ type: "CANCEL_ADD_LUMBER" }),

    // ========== Placement Actions ==========
    placeStartPoint: (point: Vector3) => {
      setStartPoint(point);
      actor.send({ type: "PLACE_START_POINT" });
    },

    placeEndPoint: (point: Vector3) => {
      const start = useInteractionStore.getState().startPoint;
      const lumberType = useInteractionStore.getState().selectedLumberType;
      const lockedFaceSnap = useInteractionStore.getState().lockedFaceSnap;

      if (start) {
        // Create and execute the command
        // Pass rotation from lockedFaceSnap if available (for proper alignment)
        const rotation = lockedFaceSnap?.rotation;
        const command = new AddLumberCommand(lumberType, start, point, rotation);
        command.execute();
      }

      actor.send({ type: "PLACE_END_POINT" });
    },
  };
}
