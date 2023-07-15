export * from "./cardStore";
export * from "./chatStore";
export * from "./joinStore";
export * from "./matStore";
export * from "./moraStore";
export * from "./placeStore";
export * from "./playerStore";
export * from "./replayStore";

import { devtools } from "valtio/utils";

import { cardStore } from "./cardStore";
import { chatStore } from "./chatStore";
import { joinStore } from "./joinStore";
import { matStore } from "./matStore";
import { moraStore } from "./moraStore";
import { placeStore } from "./placeStore";
import { playerStore } from "./playerStore";
import { replayStore } from "./replayStore";

devtools(playerStore, { name: "player", enabled: true });
devtools(chatStore, { name: "chat", enabled: true });
devtools(joinStore, { name: "join", enabled: true });
devtools(moraStore, { name: "mora", enabled: true });
devtools(matStore, { name: "mat", enabled: true });
devtools(cardStore, { name: "card", enabled: true });
devtools(placeStore, { name: "place", enabled: true });
devtools(replayStore, { name: "replay", enabled: true });

// 重置所有`Store`
export const resetUniverse = () => {
  cardStore.reset();
  chatStore.reset();
  joinStore.reset();
  matStore.reset();
  moraStore.reset();
  playerStore.reset();
  playerStore.reset();
  replayStore.reset();
};
