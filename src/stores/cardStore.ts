import { proxy } from "valtio";

import { CardMeta, fetchCard, ygopro } from "@/api";

import type { Interactivity } from "./matStore/types";

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
  chaining: boolean; // 是否在连锁中
  chainIndex?: number /*连锁的序号，如果为空表示不在连锁
  TODO: 目前是妥协的设计，因为其实一张卡是可以在同一个连锁链中被连锁多次的，这里为了避免太过复杂只保存最后的连锁序号*/;
  directAttack: boolean; // 是否正在直接攻击为玩家
  attackTarget?: CardType & { opponent: boolean }; // 攻击目标。（嵌套结构可行么？）
}

class CardStore {
  inner: CardType[] = [];
  at(zone: ygopro.CardZone, controller: number): CardType[];
  at(
    zone: ygopro.CardZone,
    controller: number,
    sequence?: number
  ): CardType | undefined;
  at(zone: ygopro.CardZone, controller: number, sequence?: number) {
    if (sequence !== undefined) {
      return this.inner
        .filter(
          (card) =>
            card.location.zone === zone &&
            card.location.controler === controller &&
            card.location.sequence === sequence
        )
        .at(0);
    } else {
      return this.inner.filter(
        (card) =>
          card.location.zone === zone && card.location.controler === controller
      );
    }
  }
  find(location: ygopro.CardLocation): CardType | undefined {
    return this.at(location.zone, location.controler, location.sequence);
  }
  async setChaining(
    location: ygopro.CardLocation,
    code: number,
    isChaining: boolean
  ): Promise<void> {
    const target = this.find(location);
    if (target) {
      target.chaining = isChaining;
      if (isChaining) {
        // 目前需要判断`isChaining`为ture才设置meta，因为有些手坑发效果后会move到墓地，
        // 运行到这里的时候已经和原来的位置对不上了，这时候不设置meta
        const meta = await fetchCard(code);
        // 这里不能设置`code`，因为存在一个场景：
        // 对方的`魔神仪-曼德拉护肤草`发动效果后，后端会发一次`MSG_SHUFFLE_HAND`，但传给前端的codes全是0，如果这里设置了`code`的话，在后面的`MSG_SHUFFLE_HAND`处理就会有问题。
        // target.code = meta.id;
        target.meta = meta;
      }
      if (target.location.zone == ygopro.CardZone.HAND) {
        target.location.position = isChaining
          ? ygopro.CardPosition.FACEUP_ATTACK
          : ygopro.CardPosition.FACEDOWN_ATTACK;
      }
    }
  }
}

export const cardStore = proxy(new CardStore());

// @ts-ignore
window.cardStore = cardStore;
