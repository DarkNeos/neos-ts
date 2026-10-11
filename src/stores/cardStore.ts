import { proxy } from "valtio";

import { CardData, CardMeta, fetchCard, ygopro } from "@/api";
import {
  STATUS_DISABLED,
  STATUS_FORBIDDEN,
  STATUS_PROC_COMPLETE,
  TYPE_FUSION,
  TYPE_LINK,
  TYPE_MONSTER,
  TYPE_RITUAL,
  TYPE_SPSUMMON,
  TYPE_SYNCHRO,
  TYPE_XYZ,
} from "@/common";

import type { Interactivity } from "./matStore/types";
import { type NeosStore } from "./shared";

/** 对局卡片的实时状态，UUID 随位置和控制权变化保持身份。 */
export interface CardType {
  uuid: string; // 一张卡的唯一标识
  /** 创建时记录的卡套归属，后续变更控制权时仍使用该归属。 */
  sleeveOwner?: number;
  sleeveType?: "main" | "extra";
  code: number; // 当前公开或已知的卡号，0 表示未知身份
  meta: CardMeta;
  originalData?: CardData; // 数据库原始属性，供实时数值比较及临时效果重置使用
  location: ygopro.CardLocation;
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  counters: { [type: number]: number }; // 指示器
  isToken: boolean; // 是否是token
  targeted: boolean; // 当前卡是否被选择成为效果的对象
  selectInfo: {
    selectable: boolean; // 是否可以被选择
    selected: boolean; // 是否已经被选择
    response?: number; // 被选择时发送给服务器的值
  };
  equipTarget?: string; // 装备目标的 UUID，随控制权和位置变化保持身份
  effectTargets?: string[]; // 持续效果对象的 UUID
  hint?: { type: number; value: number }; // 服务器维护的回合计数或宣言
  descriptionHints?: Record<number, number>; // 附加效果说明及其引用次数
  status: number; // Current status, STATUS_DISABLED, etc.
}

export class CardStore implements NeosStore {
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
  find(
    location: Pick<
      ygopro.CardLocation,
      "zone" | "controller" | "sequence" | "is_overlay" | "overlay_sequence"
    >,
  ): CardType | undefined {
    return this.at(
      location.zone,
      location.controller,
      location.sequence,
      location.is_overlay ? location.overlay_sequence : undefined,
    );
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
  /** 同时清除该卡指向其他卡的关系和其他卡指向它的关系。 */
  clearRelations(uuid: string): void {
    for (const card of this.inner) {
      if (card.uuid === uuid || card.equipTarget === uuid)
        card.equipTarget = undefined;
      card.effectTargets =
        card.uuid === uuid
          ? []
          : card.effectTargets?.filter((target) => target !== uuid);
    }
  }
  /** 恢复临时属性、指示物和关系，保留正规登场等由服务器维护的状态位。 */
  resetFieldState(card: CardType): void {
    // 只清除无效标记对应的状态位，其他协议状态仍由后端维护。
    card.status &= ~(STATUS_DISABLED | STATUS_FORBIDDEN);
    card.counters = {};
    card.targeted = false;
    card.hint = undefined;
    this.clearRelations(card.uuid);
    const data = fetchCard(card.code || card.meta.id).data;
    // 卡片资料缺失时，保留已有的原始数据作为恢复依据。
    card.meta.data = {
      ...(data.type !== undefined ? data : card.originalData),
    };
    card.originalData = { ...card.meta.data };
  }
  reset(): void {
    this.inner = [];
  }
}

// TODO: provided in class
export function isCardDisabled(card: CardType): boolean {
  const { zone, position, is_overlay } = card.location;
  return (
    !is_overlay &&
    [ygopro.CardZone.MZONE, ygopro.CardZone.SZONE].includes(zone) &&
    [
      ygopro.CardPosition.FACEUP,
      ygopro.CardPosition.FACEUP_ATTACK,
      ygopro.CardPosition.FACEUP_DEFENSE,
    ].includes(position) &&
    (card.status & (STATUS_DISABLED | STATUS_FORBIDDEN)) > 0
  );
}

/** 依据正规登场状态位，在公开的墓地或除外区标记未完成召唤手续的怪兽。 */
export function hasIncompleteSummon(card: CardType): boolean {
  const { zone, position, is_overlay } = card.location;
  const type = card.originalData?.type ?? card.meta.data.type ?? 0;
  return (
    !is_overlay &&
    [ygopro.CardZone.GRAVE, ygopro.CardZone.REMOVED].includes(zone) &&
    [
      ygopro.CardPosition.FACEUP,
      ygopro.CardPosition.FACEUP_ATTACK,
      ygopro.CardPosition.FACEUP_DEFENSE,
    ].includes(position) &&
    !!(type & TYPE_MONSTER) &&
    !!(
      type &
      (TYPE_FUSION |
        TYPE_RITUAL |
        TYPE_SYNCHRO |
        TYPE_XYZ |
        TYPE_LINK |
        TYPE_SPSUMMON)
    ) &&
    !(card.status & STATUS_PROC_COMPLETE)
  );
}

export function hasCompleteSummon(card: CardType): boolean {
  const type = card.originalData?.type ?? card.meta.data.type ?? 0;
  return (
    card.code > 0 &&
    card.location.zone !== ygopro.CardZone.DECK &&
    !card.location.is_overlay &&
    !!(type & TYPE_MONSTER) &&
    !!(
      type &
      (TYPE_FUSION |
        TYPE_RITUAL |
        TYPE_SYNCHRO |
        TYPE_XYZ |
        TYPE_LINK |
        TYPE_SPSUMMON)
    ) &&
    !!(card.status & STATUS_PROC_COMPLETE)
  );
}

export const cardStore = proxy(new CardStore());
