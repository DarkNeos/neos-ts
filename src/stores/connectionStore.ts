import { proxy } from "valtio";

export type ConnectionPhase =
  | "idle"
  | "matching"
  | "initializing"
  | "connecting"
  | "joining"
  | "connected"
  | "disconnected"
  | "error";

export const connectionStore = proxy({
  phase: "idle" as ConnectionPhase,
  message: "",
  offline: typeof navigator !== "undefined" && navigator.onLine === false,
  returnedFromBackground: false,
  set(phase: ConnectionPhase, message = "") {
    connectionStore.phase = phase;
    connectionStore.message = message;
    connectionStore.returnedFromBackground = false;
  },
});
