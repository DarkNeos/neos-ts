/*
 * 对局内状态更新逻辑的一些共用函数和数据结构
 *
 * */

import { DuelState } from "./mod";
import { Draft } from "@reduxjs/toolkit";

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
