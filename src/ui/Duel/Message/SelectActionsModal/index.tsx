import "./index.scss";

import { INTERNAL_Snapshot as Snapshot, proxy, useSnapshot } from "valtio";

import { sendSelectMultiResponse, sendSelectSingleResponse } from "@/api";

import {
  type Option,
  SelectCardsModal,
  type SelectCardsModalProps,
} from "../SelectCardsModal";

const CANCEL_RESPONSE = -1;
const FINISH_RESPONSE = -1;

const defaultProps: Omit<
  SelectCardsModalProps,
  "onSubmit" | "onCancel" | "onFinish"
> & { isChain: boolean } = {
  isOpen: false,
  isChain: false,
  min: 0,
  max: 0,
  selecteds: [] as Option[], // 最少选择多少卡
  selectables: [] as Option[], // 最多选择多少卡
  mustSelects: [] as Option[], // 单选
  cancelable: false, // 能否取消
  finishable: false, // 选择足够了之后，能否确认
  totalLevels: 0, // 需要的总等级数（用于同调/仪式/...）
  overflow: false, // 选择等级时候，是否可以溢出
};

const localStore = proxy(defaultProps);

export const SelectActionsModal: React.FC = () => {
  const {
    isOpen,
    isChain,
    min,
    max,
    selecteds,
    selectables,
    mustSelects,
    cancelable,
    finishable,
    totalLevels,
    overflow,
  } = useSnapshot(localStore);

  const onSubmit = (options: Snapshot<Option[]>) => {
    const values = options.map((option) => option.response!);
    if (isChain) {
      sendSelectSingleResponse(values[0]);
    } else {
      sendSelectMultiResponse(values);
    }
    rs();
  };

  const onFinish = () => {
    sendSelectSingleResponse(FINISH_RESPONSE);
    rs();
  };

  const onCancel = () => {
    sendSelectSingleResponse(CANCEL_RESPONSE);
    rs();
  };

  return (
    <SelectCardsModal
      {...{
        isOpen,
        min,
        max,
        selecteds,
        selectables,
        mustSelects,
        cancelable,
        finishable,
        totalLevels,
        overflow,
        onSubmit,
        onFinish,
        onCancel,
      }}
    />
  );
};

let rs: (v?: any) => void = () => {};

export const displaySelectActionsModal = async (
  args: Partial<Omit<typeof defaultProps, "isOpen">>
) => {
  resetSelectActionsModal(); // 先重置为初始状态
  Object.entries(args).forEach(([key, value]) => {
    // @ts-ignore
    localStore[key] = value;
  });
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
};

const resetSelectActionsModal = () => {
  Object.keys(defaultProps).forEach((key) => {
    // @ts-ignore
    localStore[key] = defaultProps[key];
  });
};
