/*
 * 对局内状态更新逻辑的一些共用函数和数据结构
 *
 * */

import { CardMeta } from "../../api/cards";
import { DuelState } from "./mod";
import { Draft } from "@reduxjs/toolkit";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

/*
 * 通过`player`和`selfType`判断是应该处理自己还是对手
 * */
export function judgeSelf(player: number, state: Draft<DuelState>): boolean {
  const selfType = state.selfType;
  if (selfType === 1) {
    // 自己是先攻
    return player === 0;
  } else if (selfType === 2) {
    // 自己是后攻
    return player === 1;
  } else {
    // currently never reach
    return false;
  }
}

export interface Hand {
  meta: CardMeta;
  interactivities: Interactivity<number>[];
}

export enum InteractType {
  // 可普通召唤
  SUMMON = 1,
  // 可特殊召唤
  SP_SUMMON = 2,
  // 可改变表示形式
  POS_CHANGE = 3,
  // 可前场放置
  MSET = 4,
  // 可后场放置
  SSET = 5,
  // 可发动效果
  ACTIVATE = 6,
  // 可作为位置选择
  PLACE_SELECTABLE = 7,
}

export interface Interactivity<T> {
  interactType: InteractType;
  // 如果`interactType`是`ACTIVATE`，这个字段是对应的效果编号
  activateIndex?: number;
  // 用户点击后，需要回传给服务端的`response`
  response: T;
}

export interface SlotState {
  sequence: number;
  occupant?: CardMeta;
  position?: ygopro.CardPosition;
  selectInfo?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>;
}

export type Monster = SlotState;

export type Magic = SlotState;

export interface Cemetery {
  sequence: number;
  meta: CardMeta;
}
