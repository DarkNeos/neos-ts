import { proxy } from "valtio";

import { emptyDeck, IDeck } from "./deckStore";
import { type NeosStore } from "./shared";

const KEY = "side_deck";

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

  // 因为在上一局可能会出现断线重连，
  // 所以side deck应该持久化存储在浏览器缓存里，
  // 同时为了逻辑的收敛，暂时在`SideStore`提供接口。
  //
  // TODO: 后续应该有个`Storage`模块统一管理浏览器存储的数据，
  // 这样一来卡组cdb还有文案的一些数据都可以做持久化存储，减少
  // 网络请求量。
  setSideDeck(deck: IDeck) {
    try {
      localStorage.setItem(KEY, JSON.stringify(deck));
    } catch (err) {
      console.warn(`save side in localStorage error: ${err}`);
    }
  }
  getSideDeck(): IDeck {
    const json = localStorage.getItem(KEY);
    return json ? JSON.parse(json) : emptyDeck;
  }
  reset(): void {
    this.stage = SideStage.NONE;
  }
}

export const sideStore = proxy(new SideStore());
