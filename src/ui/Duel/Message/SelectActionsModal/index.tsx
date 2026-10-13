import { useSnapshot } from "valtio";

import { getUIContainer } from "@/container/compat";
import type {
  CardSelectionOption,
  CardSelectionRequest,
} from "@/stores/cardSelectionTypes";
import { duelSelection, respondToCardSelection } from "@/stores/duelSelection";
import { fieldSelection } from "@/stores/fieldSelection";

import { SelectCardsModal } from "../SelectCardsModal";

export const SelectActionsModal: React.FC = () => {
  const { active: onField } = useSnapshot(fieldSelection);
  // 同一请求只用一种呈现方式，场上点选期间不再同时打开共享流程的弹窗。
  return onField ? null : <SelectCardsModal process={duelSelection} />;
};

export const displaySelectActionsModal = (
  args: Partial<CardSelectionRequest<CardSelectionOption>>,
) => {
  const container = getUIContainer();
  return duelSelection.open(
    {
      selectionKind: "count",
      min: 0,
      max: 0,
      single: false,
      selecteds: [],
      selectables: [],
      mustSelects: [],
      cancelable: false,
      finishable: false,
      totalLevels: 0,
      overflow: false,
      ...args,
    },
    (result) => respondToCardSelection(container, result),
  );
};
