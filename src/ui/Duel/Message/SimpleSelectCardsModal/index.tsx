// import "./index.scss";
import { INTERNAL_Snapshot as Snapshot, proxy, useSnapshot } from "valtio";

import { type Option, SelectCardsModal } from "../SelectCardsModal";

const defaultProps = {
  isOpen: false,
  selectables: [] as Option[],
};

const localStore = proxy(defaultProps);

export const SimpleSelectCardsModal: React.FC = () => {
  const { isOpen, selectables } = useSnapshot(localStore);
  return (
    <SelectCardsModal
      isOpen={isOpen}
      min={1}
      max={1}
      single={false}
      selecteds={[]}
      mustSelects={[]}
      selectables={selectables}
      cancelable
      finishable={false}
      totalLevels={0}
      overflow
      onSubmit={rs}
      onFinish={() => rs([])}
      onCancel={() => rs([])}
    />
  );
};

let rs: (options: Snapshot<Option[]>) => void = () => {};

export const displaySimpleSelectCardsModal = async (
  args: Omit<typeof defaultProps, "isOpen">,
) => {
  localStore.selectables = args.selectables;
  localStore.isOpen = true;
  const res = await new Promise<Snapshot<Option[]>>(
    (resolve) => (rs = resolve),
  ); // 等待在组件内resolve
  localStore.isOpen = false;
  return res;
};
