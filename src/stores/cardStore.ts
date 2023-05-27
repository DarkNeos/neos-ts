import { proxy } from "valtio";

import { CardData, CardText, fetchCard, ygopro } from "@/api";

import type { Interactivity } from "./matStore/types";

/**
 * 场上某位置的状态
 */
export interface CardType {
  uuid: number; // 一张卡的唯一标识
  code: number; // 卡号
  data: CardData;
  text: CardText;
  controller: number; // 控制这个位置的玩家，0或1
  originController: number; // 在卡组构建之中持有这张卡的玩家，方便reloadField的使用
  zone: ygopro.CardZone; // 怪兽区/魔法陷阱区/手牌/卡组/墓地/除外区
  position: ygopro.CardPosition; // 卡片的姿势：攻击还是守备
  sequence: number; // 卡片在区域中的序号
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivity?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
  overlayMaterials: CardType[]; // 超量素材, FIXME: 这里需要加上UUID
  xyzMonster?: CardType; // 超量怪兽（这张卡作为这个怪兽的超量素材）
  counters: { [type: number]: number }; // 指示器
  reload?: boolean; // 这个字段会在收到MSG_RELOAD_FIELD的时候设置成true，在收到MSG_UPDATE_DATE的时候设置成false
  isToken: boolean; // 是否是token

  // 新的字段（从matstore之中搬过来的）
  focus: boolean; // 用于实现动画效果，当这个字段为true时，该张卡片会被放大并在屏幕中央展示
  chaining: boolean; // 是否在连锁中
  chainIndex?: number /*连锁的序号，如果为空表示不在连锁
  TODO: 目前是妥协的设计，因为其实一张卡是可以在同一个连锁链中被连锁多次的，这里为了避免太过复杂只保存最后的连锁序号*/;
  directAttack: boolean; // 是否正在直接攻击为玩家
  attackTarget?: CardType & { opponent: boolean }; // 攻击目标。（嵌套结构可行么？）
}

class CardStore {
  inner: CardType[] = [];
  at(zone: ygopro.CardZone, controller: number): CardType[];
  at(zone: ygopro.CardZone, controller: number, sequence?: number): CardType;
  at(zone: ygopro.CardZone, controller: number, sequence?: number) {
    if (sequence !== undefined) {
      return this.inner.filter(
        (card) =>
          card.zone === zone &&
          card.controller === controller &&
          card.sequence === sequence
      )[0];
    } else {
      return this.inner.filter(
        (card) => card.zone === zone && card.controller === controller
      );
    }
  }
}

export const cardStore = proxy(new CardStore());

// @ts-ignore
window.cardStore = cardStore;
