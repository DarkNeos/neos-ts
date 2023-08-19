export * from "./accountStore";
export * from "./cardStore";
export * from "./chatStore";
export * from "./deckStore";
export * from "./initStore";
export * from "./matStore";
export * from "./placeStore";
export * from "./replayStore";
export * from "./roomStore";
export * from "./sideStore";

import { devtools } from "valtio/utils";

import { useEnv } from "@/hook";

import { accountStore } from "./accountStore";
import { cardStore } from "./cardStore";
import { chatStore } from "./chatStore";
import { deckStore } from "./deckStore";
import { initStore } from "./initStore";
import { matStore } from "./matStore";
import { placeStore } from "./placeStore";
import { replayStore } from "./replayStore";
import { roomStore } from "./roomStore";
import { sideStore } from "./sideStore";

const { DEV } = useEnv();

devtools(chatStore, { name: "chat", enabled: DEV });
devtools(matStore, { name: "mat", enabled: DEV });
devtools(cardStore, { name: "card", enabled: DEV });
devtools(placeStore, { name: "place", enabled: DEV });
devtools(replayStore, { name: "replay", enabled: DEV });
devtools(accountStore, { name: "account", enabled: DEV });
devtools(roomStore, { name: "room", enabled: DEV });
devtools(deckStore, { name: "deck", enabled: DEV });
devtools(initStore, { name: "init", enabled: DEV });
devtools(sideStore, { name: "side", enabled: DEV });

// 重置`Store`
export const resetUniverse = () => {
  roomStore.reset();
  cardStore.reset();
  chatStore.reset();
  matStore.reset();
  placeStore.reset();
  replayStore.reset();
  roomStore.reset();
  sideStore.reset();
};

// 重置决斗相关的`Store`
export const resetDuel = () => {
  cardStore.reset();
  matStore.reset();
  placeStore.reset();
};
