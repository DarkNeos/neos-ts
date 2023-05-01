import { CardData, CardMeta, CardText, fetchCard, ygopro } from "@/api";
import { proxy } from "valtio";
import { Interactivity } from "./matStore/types";

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE } = ygopro.CardZone;

/**
 * 场上某位置的状态，
 * 以后会更名为 BlockState
 */
export interface CardType {
  uuid: string; // 一张卡的唯一标识
  code: number;
  data: CardData;
  text: CardText;
  controller?: number; // 控制这个位置的玩家，0或1
  zone: ygopro.CardZone; // 怪兽区/魔法陷阱区/手牌/卡组/墓地/除外区
  position?: ygopro.CardPosition; // 卡片的姿势：攻击还是守备
  sequence: number; // 卡片在区域中的序号
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivity?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
  overlay_materials?: CardMeta[]; // 超量素材, FIXME: 这里需要加上UUID
  counters: { [type: number]: number }; // 指示器
  reload?: boolean; // 这个字段会在收到MSG_RELOAD_FIELD的时候设置成true，在收到MSG_UPDATE_DATE的时候设置成false
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
  move(
    code: number,
    from: { zone: ygopro.CardZone; controller: number; sequence: number },
    to: { zone: ygopro.CardZone; controller: number; sequence: number }
  ) {
    // TODO：考虑超量素材的情况
    const fromCards = this.at(from.zone, from.controller);
    const toCards = this.at(to.zone, to.controller);
    const target = this.at(from.zone, from.controller, from.sequence);

    if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(from.zone))
      fromCards.forEach((c) => c.sequence > from.sequence && c.sequence--);
    if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(to.zone))
      toCards.forEach((c) => c.sequence >= to.sequence && c.sequence++);
    target.zone = to.zone;
    target.controller = to.controller;
    target.sequence = to.sequence;
    target.code = code;
  }
}

export const cardStore = proxy(new CardStore());

// @ts-ignore
window.cardStore = cardStore;
