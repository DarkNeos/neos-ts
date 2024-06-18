import { shuffle } from "lodash-es";
import { proxy } from "valtio";

import { type CardMeta } from "@/api";
import { isExtraDeckCard, isToken } from "@/common";
import { Type } from "@/ui/Shared/DeckZone";

import { compareCards, type EditingDeck } from "./utils";

// Define the possible language codes (I18N)
type Language = "en" | "br" | "pt" | "fr" | "ja" | "ko" | "es" | "cn";

// Define the structure for the messages (I18N)
const messages: Record<
  Language,
  {
    cardTypeNotMatch: string;
    exceedsNumberCardsSameName: string;
    limitCards: string;
    exceedsLimit: string;
    cannotAddTokens: string;
  }
> = {
  en: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  br: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  pt: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  fr: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  ja: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  ko: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName: "The number of Extra Deck should be 0-15",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  es: {
    cardTypeNotMatch: "The Card Type does not match",
    exceedsNumberCardsSameName:
      "Exceeds the number of cards with the same name",
    limitCards: "Limit of cards",
    exceedsLimit: "Exceeds the limit",
    cannotAddTokens: "Cannot add tokens",
  },
  cn: {
    cardTypeNotMatch: "卡片种类不符合",
    exceedsNumberCardsSameName: "超过同名卡",
    limitCards: "张的上限",
    exceedsLimit: "超过",
    cannotAddTokens: "不能添加衍生物",
  },
};

// Get the language from localStorage or default to 'cn' (I18N)
const language = (localStorage.getItem("language") || "cn") as Language;
const cardTypeNotMatch = messages[language].cardTypeNotMatch;
const exceedsNumberCardsSameName =
  messages[language].exceedsNumberCardsSameName;
const limitCards = messages[language].limitCards;
const exceedsLimit = messages[language].exceedsLimit;
const cannotAddTokens = messages[language].cannotAddTokens;
/* End of definition (I18N) */

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
