// 等待房间页面的状态管理
import { proxy } from "valtio";

import { ygopro } from "@/api";
import StocHsPlayerChange = ygopro.StocHsPlayerChange;
import SelfType = ygopro.StocTypeChange.SelfType;
import HandType = ygopro.HandType;
import { type NeosStore } from "./shared";

export interface Player {
  name: string; // 玩家的昵称
  state: StocHsPlayerChange.State; // 玩家当前状态
  moraResult?: HandType; // 玩家的猜拳结果
  isMe?: boolean;
  deckInfo?: DeckInfo;
}

// 卡组的数量信息，在猜拳阶段由后端传入
interface DeckInfo {
  mainSize: number;
  extraSize: number;
  sideSize: number;
}

// 房间内当前的阶段
export enum RoomStage {
  WAITING = 0, // 正在准备
  MORA = 1, // 进入猜拳阶段，但还未选择猜拳
  HAND_SELECTING = 2, // 正在选择猜拳
  HAND_SELECTED = 3, // 选择完猜拳，等待后端返回结果
  TP_SELECTING = 4, // 正在选边
  TP_SELECTED = 5, // 选边完成，等待后端返回结果
  DUEL_START = 6, // 决斗开始
}

class RoomStore implements NeosStore {
  joined: boolean = false; // 是否已经加入房间
  players: (Player | undefined)[] = Array.from({ length: 4 }).map(
    (_) => undefined
  ); // 进入房间的玩家列表
  observerCount: number = 0; // 观战者数量
  isHost: boolean = false; // 当前玩家是否是房主
  selfType: SelfType = 0; // 当前玩家的类型

  stage: RoomStage = RoomStage.WAITING;

  getMePlayer() {
    return this.players.find((player) => player?.isMe);
  }
  getOpPlayer() {
    return this.players.find((player) => player !== undefined && !player.isMe);
  }

  reset(): void {
    this.joined = false;
    this.players = [];
    this.observerCount = 0;
    this.isHost = false;
    this.stage = RoomStage.WAITING;
  }
}

export const roomStore = proxy<RoomStore>(new RoomStore());
