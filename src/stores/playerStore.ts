/* eslint valtio/avoid-this-in-proxy: 0 */
import { proxy } from "valtio";

import { ygopro } from "@/api";
import SelfType = ygopro.StocTypeChange.SelfType;
import { NeosStore } from "./shared";

export interface Player {
  name?: string;
  state?: string;
  isHost?: boolean;
  deckInfo?: deckInfo;
}

export interface deckInfo {
  mainCnt: number;
  extraCnt: number;
  sideCnt: number;
}

export interface PlayerState extends NeosStore {
  player0: Player;
  player1: Player;
  observerCount: number;
  isHost: boolean;
  selfType: SelfType;
  getMePlayer: () => Player;
  getOpPlayer: () => Player;
}

const initialState = {
  player0: {},
  player1: {},
  observerCount: 0,
  isHost: false,
  selfType: SelfType.UNKNOWN,
};

export const playerStore = proxy<PlayerState>({
  ...initialState,
  getMePlayer() {
    if (this.selfType === SelfType.PLAYER1) return this.player0;
    return this.player1;
  },
  getOpPlayer() {
    if (this.selfType === SelfType.PLAYER1) return this.player1;
    return this.player0;
  },
  reset() {
    // Object.keys(initialState).forEach((key) => {
    //   // @ts-ignore
    //   playerStore[key] = initialState[key];
    // });
    // 不知道为啥上面这样写状态不能更新，暂时采用比较笨的方法
    this.player0 = {};
    this.player1 = {};
    this.observerCount = 0;
    this.isHost = false;
    this.selfType = SelfType.UNKNOWN;
  },
});
