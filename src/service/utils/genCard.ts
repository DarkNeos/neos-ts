import { proxy } from "valtio";
import { subscribeKey } from "valtio/utils";

import { fetchCard } from "@/api";
import { CardType } from "@/stores";

// 自动从code推断出meta
export const genCard = (card: CardType) => {
  const t = proxy(card);
  subscribeKey(t, "code", (code) => {
    const meta = fetchCard(code);
    t.meta = meta;
  });
  return t;
};
