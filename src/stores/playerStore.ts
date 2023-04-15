import { proxy } from "valtio";

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
}

export const playerStore = proxy<PlayerState>({
  player0: {},
  player1: {},
  observerCount: 0,
  isHost: false,
});
