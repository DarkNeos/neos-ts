/*
 * 对局内状态更新逻辑的一些共用函数和数据结构
 *
 * */

import { CardMeta } from "../../api/cards";

/*
 * 通过`player`和`selfType`判断是应该处理自己还是对手
 * */
export function judgeSelf(
  player: number,
  selfType: number | undefined
): boolean {
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

/*
 * `Neos`中表示卡牌的通用结构
 * */
export interface Card {
  meta: CardMeta;
  transform: CardTransform;
  interactivities: Interactivity[];
}

interface CardTransform {
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
}

export enum InteractType {
  // 可普通召唤
  SUMMON,
  // 可特殊召唤
  SP_SUMMON,
  // 可改变表示形式
  POS_CHANGE,
  // 可前场放置
  MSET,
  // 可后场放置
  SSET,
  // 可发动效果
  ACTIVATE,
}

interface Interactivity {
  interactType: InteractType;
  // 如果`interactType`是`ACTIVATE`，这个字段是对应的效果编号
  activateIndex: number;
}
