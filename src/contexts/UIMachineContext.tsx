import { createContext, useContext, type ReactNode } from "react";
import { createActor } from "xstate";
import { uiMachine } from "../machines/uiMachine";
import type { ActorRefFrom } from "xstate";

// Create the actor once at module level
const uiActor = createActor(uiMachine);
uiActor.start();

type UIMachineActorType = ActorRefFrom<typeof uiMachine>;

const UIMachineContext = createContext<UIMachineActorType | null>(null);

function UIMachineProvider({ children }: { children: ReactNode }) {
  return (
    <UIMachineContext.Provider value={uiActor}>
      {children}
    </UIMachineContext.Provider>
  );
}

function useUIMachineActor() {
  const context = useContext(UIMachineContext);
  if (!context) {
    throw new Error("useUIMachineActor must be used within UIMachineProvider");
  }
  return context;
}

export {
  UIMachineProvider,
  // eslint-disable-next-line react-refresh/only-export-components
  useUIMachineActor,
};
