import { INTERNAL_Snapshot as Snapshot, proxy, useSnapshot } from "valtio";

import { sendSelectMultiResponse, sendSelectSingleResponse } from "@/api";
import { getUIContainer } from "@/container/compat";

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
  min: 0, // 最少选择多少卡
  max: 0, // 最多选择多少卡
  single: false, // 是否只能单选
  selecteds: [] as Option[],
  selectables: [] as Option[],
  mustSelects: [] as Option[],
  cancelable: false, // 能否取消
  finishable: false, // 选择足够了之后，能否确认
  totalLevels: 0, // 需要的总等级数（用于同调/仪式/...）
  overflow: false, // 选择等级时候，是否可以溢出
};

const localStore = proxy(defaultProps);

export const SelectActionsModal: React.FC = () => {
  const container = getUIContainer();
  const snap = useSnapshot(localStore);

  const onSubmit = (options: Snapshot<Option[]>) => {
    const values = options.map((option) => option.response!);
    if (localStore.isChain) {
      sendSelectSingleResponse(container.conn, values[0]);
    } else {
      sendSelectMultiResponse(container.conn, values);
    }
    rs();
  };

  const onFinish = () => {
    sendSelectSingleResponse(container.conn, FINISH_RESPONSE);
    rs();
  };

  const onCancel = () => {
    sendSelectSingleResponse(container.conn, CANCEL_RESPONSE);
    rs();
  };

  return (
    <SelectCardsModal
      {...{
        ...snap,
        onSubmit,
        onFinish,
        onCancel,
      }}
    />
  );
};

let rs: (v?: any) => void = () => {};

export const displaySelectActionsModal = async (
  args: Partial<Omit<typeof defaultProps, "isOpen">>,
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
