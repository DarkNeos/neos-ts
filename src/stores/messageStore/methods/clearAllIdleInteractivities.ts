import { matStore } from "@/stores";

export const clearAllIdleInteractivities = (controller: number) => {
  matStore.banishedZones.of(controller).clearIdleInteractivities();
  matStore.decks.of(controller).clearIdleInteractivities();
  matStore.extraDecks.of(controller).clearIdleInteractivities();
  matStore.graveyards.of(controller).clearIdleInteractivities();
  matStore.hands.of(controller).clearIdleInteractivities();
  matStore.magics.of(controller).clearIdleInteractivities();
  matStore.monsters.of(controller).clearIdleInteractivities();
};
