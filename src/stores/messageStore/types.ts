import type { CardMeta, ygopro } from "@/api";
type CardLocation = ReturnType<typeof ygopro.CardLocation.prototype.toObject>;

interface Option {
  // card id
  meta: CardMeta;
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
    interactivies: { desc: string; response: number; effectCode?: number }[];
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
  // 宣言弹窗
  announceModal: {
    isOpen: boolean;
    title?: string;
    min: number;
    options: {
      info: string;
      response: number;
    }[];
  };
}
