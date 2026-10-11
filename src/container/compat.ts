import { WebSocketStream } from "@/infra";
import {
  cardStore,
  chatStore,
  historyStore,
  matStore,
  placeStore,
  roomStore,
  sideStore,
  trainingStore,
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
    // 连接处理与界面使用同一个训练状态，规则错误能直接显示到页面。
    trainingStore,
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
