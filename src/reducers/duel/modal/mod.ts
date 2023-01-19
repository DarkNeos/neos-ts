import { ygopro } from "../../../api/ocgcore/idl/ocgcore";

export interface ModalState {
  // 卡牌弹窗
  cardModal: {
    isOpen: boolean;
    name?: string;
    desc?: string;
    imgUrl?: string;
    interactivies: { desc: string; response: number }[];
  };
  // 卡牌列表弹窗
  cardListModal: {
    isOpen: boolean;
    list: {
      name?: string;
      desc?: string;
      imgUrl?: string;
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
        code: number;
        name?: string;
        desc?: string;
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
      response?: number;
    }[];
  };
}

export * from "./cardModalSlice";
export * from "./cardListModalSlice";
export * from "./checkCardModalSlice";
export * from "./yesNoModalSlice";
export * from "./positionModalSlice";
export * from "./optionModalSlice";
export * from "./checkCardModalV2Slice";
