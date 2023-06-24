// import "./index.scss";

import { type FC } from "react";
import { proxy, useSnapshot, INTERNAL_Snapshot as Snapshot } from "valtio";

import { SelectCardsModal, type Option } from "../SelectCardsModal";

const defaultProps = {
  isOpen: false,
  selectables: [] as Option[],
};

const localStore = proxy(defaultProps);

export const SimpleSelectCardsModal: FC = () => {
  const { isOpen, selectables } = useSnapshot(localStore);
  return (
    <SelectCardsModal
      isOpen={isOpen}
      isChain={false}
      min={1}
      max={1}
      single
      selecteds={[]}
      mustSelects={[]}
      selectables={selectables}
      cancelable
      finishable={false}
      totalLevels={1}
      overflow
      onSubmit={(options) => rs(options)}
      onFinish={() => rs([])}
      onCancel={() => rs([])}
    />
  );
};

let rs: (options: Snapshot<Option[]>) => void = () => {};

export const displaySimpleSelectActionsModal = async (
  args: Omit<typeof defaultProps, "isOpen">
) => {
  localStore.isOpen = true;
  localStore.selectables = args.selectables;
  await new Promise<Snapshot<Option[]>>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
};
