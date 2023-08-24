import { proxy } from "valtio";

import { type CardMeta } from "@/api";
import { isExtraDeckCard, isToken } from "@/common";

import { compareCards, type EditingDeck, type Type } from "./utils";

export const editDeckStore = proxy({
  deckName: "",
  main: [] as CardMeta[],
  extra: [] as CardMeta[],
  side: [] as CardMeta[],

  // 标脏
  edited: false,

  // 方法
  add(type: Type, card: CardMeta) {
    editDeckStore[type].push(card);
    editDeckStore[type].sort(compareCards);
    editDeckStore.edited = true;
  },
  remove(type: Type, card: CardMeta) {
    const index = editDeckStore[type].findIndex((item) => item.id === card.id);
    if (index !== -1) {
      editDeckStore[type].splice(index, 1);
      editDeckStore.edited = true;
    }
  },
  set(deck: EditingDeck) {
    editDeckStore.deckName = deck.deckName;
    editDeckStore.main = deck.main.sort(compareCards);
    editDeckStore.extra = deck.extra.sort(compareCards);
    editDeckStore.side = deck.side.sort(compareCards);
    editDeckStore.edited = false;
  },
  clear() {
    editDeckStore.main = [];
    editDeckStore.extra = [];
    editDeckStore.side = [];
    editDeckStore.edited = true;
  },
  getAll() {
    return [
      ...editDeckStore.main,
      ...editDeckStore.extra,
      ...editDeckStore.side,
    ];
  },
  /** 一张卡能不能放入某个区 */
  canAdd(
    card: CardMeta,
    type: Type,
    source: Type | "search",
  ): { result: boolean; reason: string } {
    const deckType = editDeckStore[type];
    const cardType = card.data.type ?? 0;

    let result = true,
      reason = "";

    if (isToken(cardType)) {
      result = false;
      reason = "不能添加衍生物";
    }

    const countLimit = type === "main" ? 60 : 15;
    if (deckType.length >= countLimit) {
      result = false;
      reason = `超过 ${countLimit} 张的上限`;
    }

    if (
      (type === "extra" && !isExtraDeckCard(cardType)) ||
      (type === "main" && isExtraDeckCard(cardType))
    ) {
      result = false;
      reason = "卡片种类不符合";
    }

    const max = 3; // 这里无需参考禁卡表
    const numOfSameCards =
      editDeckStore.getAll().filter((c) => c.id === card.id).length -
      (source !== "search" ? 1 : 0);

    if (numOfSameCards >= max) {
      result = false;
      reason = `超过同名卡 ${max} 张的上限`;
    }

    return { result, reason };
  },
}) satisfies EditingDeck;
