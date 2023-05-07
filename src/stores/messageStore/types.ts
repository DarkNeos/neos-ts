import type { CardMeta, ygopro } from "@/api";
type CardLocation = ReturnType<typeof ygopro.CardLocation.prototype.toObject>;

interface Option {
  // card id
  code: number;
  location?: CardLocation;
  // 效果
  effectDesc?: string;
  // 作为素材的cost，比如同调召唤的星级
  level1?: number;
  level2?: number;
  response: number;
}

export interface ModalState {
  // 卡牌弹窗
  cardModal: {
    isOpen: boolean;
    meta?: CardMeta;
    interactivies: { desc: string; response: number }[];
    counters: { [type: number]: number };
  };
  // 卡牌列表弹窗
  cardListModal: {
    isOpen: boolean;
    list: {
      meta?: CardMeta;
      interactivies: { desc: string; response: number }[];
    }[];
  };
  // 卡牌选择状态
  selectCardActions: {
    isOpen: boolean;
    min?: number;
    max?: number;
    cancelAble: boolean;
    finishAble: boolean;
    // 上级/同调/超量/链接召唤的总cost
    totalLevels?: number;
    // cost是否可以溢出，比如同调召唤是false，某些链接召唤是true
    overflow?: boolean;
    // 已经选择的列表
    selecteds: Option[];
    // 可以选择的列表
    selectables: Option[];
    // 必须选择的列表
    mustSelects: Option[];
  };
  // Yes or No弹窗
  yesNoModal: {
    isOpen: boolean;
    msg?: string;
  };
  // 表示形式选择弹窗
  positionModal: {
    isOpen: boolean;
    positions: ygopro.CardPosition[];
  };
  // 选项选择弹窗
  optionModal: {
    isOpen: boolean;
    options: { msg: string; response: number }[];
  };
  // 指示器选择弹窗
  checkCounterModal: {
    isOpen: boolean;
    counterType?: number;
    min?: number;
    options: {
      code: number;
      max: number;
    }[];
  };
  // 卡牌排序弹窗
  sortCardModal: {
    isOpen: boolean;
    options: {
      meta: CardMeta;
      response: number;
    }[];
  };
}
