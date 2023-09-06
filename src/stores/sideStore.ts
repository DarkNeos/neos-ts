import { proxy } from "valtio";

import { emptyDeck, IDeck } from "./deckStore";
import { type NeosStore } from "./shared";

export enum SideStage {
  NONE = 0, // 没有进入SIDE阶段
  SIDE_CHANGING = 1, // 正在更换副卡组
  SIDE_CHANGED = 2, // 副卡组更换完毕
  TP_SELECTING = 5, // 正在选边
  TP_SELECTED = 6, // 选边完成
  DUEL_START = 7, // 决斗开始
  WAITING = 8, // 观战者等待双方玩家
}

class SideStore implements NeosStore {
  stage: SideStage = SideStage.NONE;
  deck: IDeck = emptyDeck;
  reset(): void {
    this.stage = SideStage.NONE;
    this.deck = emptyDeck;
  }
}

export const sideStore = proxy(new SideStore());
