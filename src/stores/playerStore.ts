import { proxy } from "valtio";

import { ygopro } from "@/api";
import SelfType = ygopro.StocTypeChange.SelfType;

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

export interface PlayerState {
  player0: Player;
  player1: Player;
  observerCount: number;
  isHost: boolean;
  selfType: SelfType;
  getMePlayer: () => Player;
  getOpPlayer: () => Player;
}

export const playerStore = proxy<PlayerState>({
  player0: {},
  player1: {},
  observerCount: 0,
  isHost: false,
  selfType: SelfType.UNKNOWN,
  getMePlayer() {
    if (this.selfType == SelfType.PLAYER1) return this.player0;
    return this.player1;
  },
  getOpPlayer() {
    if (this.selfType == SelfType.PLAYER1) return this.player1;
    return this.player0;
  },
});
