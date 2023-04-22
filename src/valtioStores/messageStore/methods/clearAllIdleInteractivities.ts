import { matStore } from "@/valtioStores";

export const clearAllIdleInteractivities = (controller: number) => {
  matStore.banishedZones.clearIdleInteractivities(controller);
  matStore.decks.clearIdleInteractivities(controller);
  matStore.extraDecks.clearIdleInteractivities(controller);
  matStore.graveyards.clearIdleInteractivities(controller);
  matStore.hands.clearIdleInteractivities(controller);
  matStore.magics.clearIdleInteractivities(controller);
  matStore.monsters.clearIdleInteractivities(controller);
};
