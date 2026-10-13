import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";

import { fetchCard, ygopro } from "@/api";
import { isExtraDeckCard } from "@/common";
import { CardType } from "@/stores";

/** 创建可观察的卡片状态，卡号变化时同步重建资料和原始数值。 */
export const genCard = (card: CardType) => {
  const t = proxy({
    ...card,
    // 卡套按初始归属和卡组种类保存，不随当前控制权或区域变化切换。
    sleeveOwner: card.sleeveOwner ?? card.location.controller,
    sleeveType:
      card.sleeveType ??
      (card.location.zone === ygopro.CardZone.EXTRA ||
      isExtraDeckCard(card.meta.data.type ?? 0)
        ? "extra"
        : "main"),
    originalData: card.originalData ?? { ...card.meta.data },
  });
  // 同步订阅确保本条协议消息后续读取到新卡号的资料，无需等待界面渲染。
  subscribeKey(
    t,
    "code",
    (code) => {
      const meta = fetchCard(code);
      t.meta = meta;
      t.originalData = { ...meta.data };
    },
    true,
  );
  return t;
};
