import { proxy } from "valtio";

import { CardMeta, ygopro } from "@/api";

import type { Interactivity } from "./matStore/types";
import { type NeosStore } from "./shared";

/**
 * 场上某位置的状态
 */
export interface CardType {
  uuid: string; // 一张卡的唯一标识
  code: number; // 卡号
  meta: CardMeta; // 卡片元数据
  location: ygopro.CardLocation;
  originController: number; // 在卡组构建之中持有这张卡的玩家，方便reloadField的使用
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivity?: Interactivity<{
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
  counters: { [type: number]: number }; // 指示器
  isToken: boolean; // 是否是token
  chainIndex?: number /*连锁的序号，如果为空表示不在连锁
  TODO: 目前是妥协的设计，因为其实一张卡是可以在同一个连锁链中被连锁多次的，这里为了避免太过复杂只保存最后的连锁序号*/;
  selected: boolean; // 当前卡是否被选择成为效果的对象
}

class CardStore implements NeosStore {
  inner: CardType[] = [];
  at(zone: ygopro.CardZone, controller: number): CardType[];
  at(
    zone: ygopro.CardZone,
    controller: number,
    sequence?: number,
    overlay_sequence?: number,
  ): CardType | undefined;
  at(
    zone: ygopro.CardZone,
    controller: number,
    sequence?: number,
    overlay_sequence?: number,
  ) {
    if (sequence !== undefined) {
      if (overlay_sequence !== undefined) {
        return this.inner
          .filter(
            (card) =>
              card.location.zone === zone &&
              card.location.controller === controller &&
              card.location.sequence === sequence &&
              card.location.is_overlay === true &&
              card.location.overlay_sequence === overlay_sequence,
          )
          .at(0);
      } else {
        return this.inner
          .filter(
            (card) =>
              card.location.zone === zone &&
              card.location.controller === controller &&
              card.location.sequence === sequence &&
              card.location.is_overlay === false,
          )
          .at(0);
      }
    } else {
      return this.inner.filter(
        (card) =>
          card.location.zone === zone &&
          card.location.controller === controller &&
          card.location.is_overlay === false,
      );
    }
  }
  find(location: ygopro.CardLocation): CardType | undefined {
    return this.at(location.zone, location.controller, location.sequence);
  }
  // 获取特定位置下的所有超量素材
  findOverlay(
    zone: ygopro.CardZone,
    controller: number,
    sequence: number,
  ): CardType[] {
    return this.inner.filter(
      (card) =>
        card.location.zone === zone &&
        card.location.controller === controller &&
        card.location.sequence === sequence &&
        card.location.is_overlay,
    );
  }
  reset(): void {
    this.inner = [];
  }
}

export const cardStore = proxy(new CardStore());

// @ts-ignore
window.cardStore = cardStore;
