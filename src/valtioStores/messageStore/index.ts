import { proxy } from "valtio";

import type { CardMeta } from "@/api/cards";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";

export const messageStore = proxy<ModalState>({
  cardModal: { isOpen: false, interactivies: [], counters: {} },
  cardListModal: { isOpen: false, list: [] },
  checkCardModal: { isOpen: false, cancelAble: false, tags: [] },
  yesNoModal: { isOpen: false },
  positionModal: { isOpen: false, positions: [] },
  optionModal: { isOpen: false, options: [] },
  checkCardModalV2: {
    isOpen: false,
    cancelAble: false,
    finishAble: false,
    responseable: false,
    selectableOptions: [],
    selectedOptions: [],
  },
  checkCardModalV3: {
    isOpen: false,
    overflow: false,
    allLevel: 0,
    mustSelectList: [],
    selectAbleList: [],
  },
  checkCounterModal: {
    isOpen: false,
    options: [],
  },
  sortCardModal: {
    isOpen: false,
    options: [],
  },
});

// >>> modal types >>>
type CardLocation = ReturnType<typeof ygopro.CardLocation.prototype.toObject>;

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
  // 卡牌选择弹窗
  checkCardModal: {
    isOpen: boolean;
    onSubmit?: string;
    selectMin?: number;
    selectMax?: number;
    cancelAble: boolean;
    cancelResponse?: number;
    tags: {
      tagName: string;
      options: {
        meta: CardMeta;
        location?: CardLocation;
        effectDescCode?: number;
        effectDesc?: string;
        response: number;
      }[];
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
  // 选项选择弹窗
  optionModal: {
    isOpen: boolean;
    options: { msg: string; response: number }[];
  };
  // 卡牌选择弹窗V2
  checkCardModalV2: {
    isOpen: boolean;
    cancelAble: boolean;
    finishAble: boolean;
    selectMin?: number;
    selectMax?: number;
    responseable?: boolean;
    selectableOptions: {
      code: number;
      name?: string;
      desc?: string;
      response: number;
    }[];
    selectedOptions: {
      code: number;
      name?: string;
      desc?: string;
      response: number;
    }[];
  };
  // 卡牌选择弹窗V3
  checkCardModalV3: {
    isOpen: boolean;
    overflow: boolean;
    allLevel: number;
    selectMin?: number;
    selectMax?: number;
    responseable?: boolean;
    mustSelectList: {
      meta: CardMeta;
      level1: number;
      level2: number;
      response: number;
    }[];
    selectAbleList: {
      meta: CardMeta;
      level1: number;
      level2: number;
      response: number;
    }[];
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
// <<< modal types <<<
