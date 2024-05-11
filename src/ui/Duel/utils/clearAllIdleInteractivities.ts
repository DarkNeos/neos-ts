import { cardStore } from "@/stores";

export function clearAllIdleInteractivities() {
  for (const card of cardStore.inner) {
    card.idleInteractivities = [];
  }
}
