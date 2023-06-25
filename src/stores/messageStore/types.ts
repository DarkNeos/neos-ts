import type { CardMeta, ygopro } from "@/api";

export interface ModalState {
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
