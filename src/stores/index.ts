export * from "./cardStore";
export * from "./chatStore";
export * from "./joinStore";
export * from "./matStore";
export * from "./messageStore";
export * from "./methods";
export * from "./moraStore";
export * from "./placeStore";

import { devtools } from "valtio/utils";

import { cardStore } from "./cardStore";
import { chatStore } from "./chatStore";
import { joinStore } from "./joinStore";
import { matStore } from "./matStore";
import { messageStore } from "./messageStore";
import { moraStore } from "./moraStore";
import { placeStore } from "./placeStore";

devtools(chatStore, { name: "chat store", enabled: true });
devtools(joinStore, { name: "join store", enabled: true });
devtools(moraStore, { name: "mora store", enabled: true });
devtools(matStore, { name: "mat store", enabled: true });
devtools(messageStore, { name: "message store", enabled: true });
devtools(cardStore, { name: "card store", enabled: true });
devtools(placeStore, { name: "place store", enabled: true });
