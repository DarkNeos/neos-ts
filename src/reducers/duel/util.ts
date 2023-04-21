/*
 * 对局内状态更新逻辑的一些共用函数和数据结构
 *
 * */

import { Draft } from "@reduxjs/toolkit";

import { ygopro } from "@/api";

import { CardState } from "./generic";
import { DuelState } from "./mod";

type Location =
  | ygopro.CardLocation
  | ReturnType<typeof ygopro.CardLocation.prototype.toObject>;

/*
 * 通过`player`和`selfType`判断是应该处理自己还是对手
 * */
export function judgeSelf(player: number, state: Draft<DuelState>): boolean {
  const selfType = state.selfType;
  if (selfType === 1) {
    // 自己是先攻
    return player == 0;
  } else if (selfType === 2) {
    // 自己是后攻
    return player == 1;
  } else {
    // currently never reach
    return false;
  }
}

/*
 * 通过`controler`,`zone`和`sequence`获取卡牌状态*/
export function findCardByLocation(
  state: Draft<DuelState>,
  location: Location
): CardState | undefined {
  const controler = location.controler!;
  const zone = location.location;
  const sequence = location.sequence;

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
      const banishedZones = judgeSelf(controler, state)
        ? state.meBanishedZone
        : state.opBanishedZone;
      return banishedZones?.inner.find(finder);
    }
    case ygopro.CardZone.GRAVE: {
      const cemerety = judgeSelf(controler, state)
        ? state.meGraveyard
        : state.opGraveyard;
      return cemerety?.inner.find(finder);
    }
    default: {
      return undefined;
    }
  }
}

export function cmpCardLocation(
  left: Location,
  right?: Location,
  strict?: boolean
): boolean {
  if (strict) {
    return JSON.stringify(left) === JSON.stringify(right);
  } else {
    return (
      left.controler === right?.controler &&
      left.location === right?.location &&
      left.sequence === right?.sequence
    );
  }
}
