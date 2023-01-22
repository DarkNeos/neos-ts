/*
 * 对局内状态更新逻辑的一些共用函数和数据结构
 *
 * */

import { DuelState } from "./mod";
import { Draft } from "@reduxjs/toolkit";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { CardState } from "./generic";

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

/*
 * 通过`controler`,`zone`和`sequence`获取卡牌状态*/
export function findCardByLocation(
  state: Draft<DuelState>,
  controler: number,
  zone: ygopro.CardZone,
  sequence: number
): CardState | undefined {
  const finder = (_: any, idx: number) => idx == sequence;

  switch (zone) {
    case ygopro.CardZone.HAND: {
      const hands = judgeSelf(controler, state) ? state.meHands : state.opHands;
      return hands?.inner.find(finder);
    }
    case ygopro.CardZone.MZONE: {
      const monsters = judgeSelf(controler, state)
        ? state.meMonsters
        : state.opMonsters;
      return monsters?.inner.find(finder);
    }
    case ygopro.CardZone.SZONE: {
      const magics = judgeSelf(controler, state)
        ? state.meMagics
        : state.opMagics;
      return magics?.inner.find(finder);
    }
    case ygopro.CardZone.REMOVED: {
      const exclusions = judgeSelf(controler, state)
        ? state.meExclusion
        : state.opExclusion;
      return exclusions?.inner.find(finder);
    }
    case ygopro.CardZone.GRAVE: {
      const cemerety = judgeSelf(controler, state)
        ? state.meCemetery
        : state.opCemetery;
      return cemerety?.inner.find(finder);
    }
    case ygopro.CardZone.ONFIELD: {
      const field = judgeSelf(controler, state) ? state.meField : state.opField;
      if (sequence == 0) {
        return field?.inner;
      } else {
        return undefined;
      }
    }
    default: {
      return undefined;
    }
  }
}
