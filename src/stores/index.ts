export * from "./cardStore";
export * from "./chatStore";
export * from "./joinStore";
export * from "./matStore";
export * from "./messageStore";
export * from "./moraStore";
export * from "./placeStore";
export * from "./playerStore";

import { devtools } from "valtio/utils";

import { cardStore } from "./cardStore";
import { chatStore } from "./chatStore";
import { joinStore } from "./joinStore";
import { matStore } from "./matStore";
import { messageStore } from "./messageStore";
import { moraStore } from "./moraStore";
import { placeStore } from "./placeStore";
import { playerStore } from "./playerStore";

devtools(playerStore, { name: "player", enabled: true });
devtools(chatStore, { name: "chat", enabled: true });
devtools(joinStore, { name: "join", enabled: true });
devtools(moraStore, { name: "mora", enabled: true });
devtools(matStore, { name: "mat", enabled: true });
devtools(messageStore, { name: "message", enabled: true });
devtools(cardStore, { name: "card", enabled: true });
devtools(placeStore, { name: "place", enabled: true });
