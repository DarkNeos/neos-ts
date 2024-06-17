import { shuffle } from "lodash-es";
import { proxy } from "valtio";

import { type CardMeta } from "@/api";
import { isExtraDeckCard, isToken } from "@/common";
import { Type } from "@/ui/Shared/DeckZone";

import { compareCards, type EditingDeck } from "./utils";

const language = localStorage.getItem("language");
const cardTypeNotMatch =
  language !== "cn" ? "The Card Type does not match" : "卡片种类不符合";
const exceedsNumberCardsSameName =
  language !== "cn"
    ? "Exceeds the number of cards with the same name"
    : "超过同名卡";
const limitCards = language !== "cn" ? "Limit of cards" : "张的上限";
const exceedsLimit = language !== "cn" ? "Exceeds the limit" : "超过";
const cannotAddTokens =
  language !== "cn" ? "Cannot add tokens" : "不能添加衍生物";

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
    editDeckStore.main = deck.main;
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
  /**
   * 打乱
   * @description 通常只有主卡组有打乱的需求，但这里也支持额外和副卡组
   */
  shuffle(deck: EditingDeck, type: Type = "main") {
    editDeckStore[type] = shuffle(deck[type]);
    editDeckStore.edited = true;
  },
  sort(deck: EditingDeck, type: Type = "main") {
    editDeckStore[type] = deck[type].sort(compareCards);
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
      reason = cannotAddTokens;
    }

    const countLimit = type === "main" ? 60 : 15;
    if (deckType.length >= countLimit) {
      result = false;
      reason = `${exceedsLimit} ${countLimit} ${limitCards}`;
    }

    if (
      (type === "extra" && !isExtraDeckCard(cardType)) ||
      (type === "main" && isExtraDeckCard(cardType))
    ) {
      result = false;
      reason = cardTypeNotMatch;
    }
    const max = 3; // 这里无需参考禁卡表
    const numOfSameCards =
      editDeckStore
        .getAll()
        .filter(
          (c) =>
            c.id === card.id ||
            c.data.alias === card.id ||
            c.id === card.data.alias,
        ).length - (source !== "search" ? 1 : 0);

    if (numOfSameCards >= max) {
      result = false;
      reason = `${exceedsNumberCardsSameName} ${max} ${limitCards}`;
    }

    return { result, reason };
  },
}) satisfies EditingDeck;
