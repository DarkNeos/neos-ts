import { matStore } from "@/stores";
import { CardSelectionProcess } from "@/stores/cardSelectionProcess";
import type { CardSelectionOption } from "@/stores/cardSelectionTypes";
import { registerDuelDialogReset } from "@/stores/duelDialogs";

import { SelectCardsModal } from "../SelectCardsModal";

// 这类弹窗只返回卡片给调用方，不发送协议响应，因此使用独立的选卡实例。
const selection = new CardSelectionProcess<CardSelectionOption>();
let generation = 0;
registerDuelDialogReset(() => selection.reset());

export const SimpleSelectCardsModal: React.FC = () => (
  <SelectCardsModal process={selection} />
);

export const displaySimpleSelectCardsModal = async (args: {
  selectables: CardSelectionOption[];
  signal?: AbortSignal;
}) => {
  if (args.signal?.aborted) return [];
  const id = ++generation;
  const pending = selection.open(
    {
      selectionKind: "count",
      min: 1,
      max: 1,
      single: false,
      selecteds: [],
      mustSelects: [],
      selectables: args.selectables,
      cancelable: true,
      finishable: false,
      totalLevels: 0,
      overflow: false,
    },
    () => {
      matStore.hint.esHint = undefined;
      matStore.hint.esSelectHint = undefined;
    },
  );

  const abort = () => {
    if (generation === id) selection.reset();
  };
  args.signal?.addEventListener("abort", abort, { once: true });
  try {
    return await pending;
  } finally {
    args.signal?.removeEventListener("abort", abort);
  }
};
