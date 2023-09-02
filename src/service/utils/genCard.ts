import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";

import { fetchCard } from "@/api";
import { CardType } from "@/stores";

// 自动从code推断出meta
//
// TODO: 其实不是很推荐这样做，因为随着项目复杂度增加，这样可能会带来meta更新的时序问题
export const genCard = (card: CardType) => {
  const t = proxy(card);
  subscribeKey(t, "code", (code) => {
    const meta = fetchCard(code);
    t.meta = meta;
  });
  return t;
};
