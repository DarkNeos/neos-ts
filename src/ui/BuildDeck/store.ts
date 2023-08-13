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
  /** 一张卡能不能放入某个区 */
  canAdd(card: CardMeta, type: Type): { result: boolean; reason: string } {
    let result = true,
      reason = "";
    const initialCards = editDeckStore[type];
    // 如果是衍生物，则不能添加
    if (isToken(card.data.type ?? 0)) {
      result = false;
      reason = "不能添加衍生物";
    }
    // 超出数量，则不能添加
    const countLimit = type === "main" ? 60 : 15;
    if (initialCards.length >= countLimit) {
      result = false;
      reason = `超过 ${countLimit} 张的上限`;
    }
    // 接着需要检查卡的种类
    if (
      (type === "extra" && !isExtraDeckCard(card.data.type ?? 0)) ||
      (type === "main" && isExtraDeckCard(card.data.type ?? 0))
    ) {
      result = false;
      reason = "卡片种类不符合";
    }
    // 同名卡不超过三张
    const maxSameCard = 3; // TODO: 禁卡表
    const sameCardCount = initialCards.filter((c) => c.id === card.id).length;
    if (sameCardCount >= maxSameCard) {
      result = false;
      reason = `超过同名卡 ${maxSameCard} 张的上限`;
    }
    return { result, reason };
  },
}) satisfies EditingDeck;