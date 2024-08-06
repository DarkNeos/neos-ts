import { WebSocketStream } from "@/infra";
import {
  cardStore,
  chatStore,
  historyStore,
  matStore,
  placeStore,
  roomStore,
  sideStore,
} from "@/stores";

import { CONTAINERS } from ".";
import { Context } from "./context";
import { Container } from "./impl";

const UI_KEY = "NEOS_UI";

export function initUIContainer(conn: WebSocketStream) {
  const context = new Context({
    matStore,
    cardStore,
    placeStore,
    roomStore,
    chatStore,
    sideStore,
    historyStore,
  });
  const container = new Container(context, conn);

  CONTAINERS.set(UI_KEY, container);
}

export function getUIContainer(): Container {
  const container = CONTAINERS.get(UI_KEY);

  if (container) {
    return container;
  } else {
    throw Error("UI Container not initialized !!");
  }
}
