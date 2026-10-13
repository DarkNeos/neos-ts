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
    cardTypeNotMatch: "O Tipo de Carta não corresponde",
    exceedsNumberCardsSameName: "Excede o número de cartas com o mesmo nome",
    limitCards: "Limite de cartas",
    exceedsLimit: "Excede o limite",
    cannotAddTokens: "Não é possível adicionar fichas",
  },
  pt: {
    cardTypeNotMatch: "O Tipo de Carta não corresponde",
    exceedsNumberCardsSameName: "Excede o número de cartas com o mesmo nome",
    limitCards: "Limite de cartas",
    exceedsLimit: "Excede o limite",
    cannotAddTokens: "Não é possível adicionar fichas",
  },
  fr: {
    cardTypeNotMatch: "Le Type de Carte ne correspond pas",
    exceedsNumberCardsSameName: "Dépasse le nombre de cartes avec le même nom",
    limitCards: "Limite de cartes",
    exceedsLimit: "Dépasse la limite",
    cannotAddTokens: "Impossible d'ajouter des jetons",
  },
  ja: {
    cardTypeNotMatch: "カードタイプが一致しません",
    exceedsNumberCardsSameName: "同名カードの枚数を超えています",
    limitCards: "カードの制限",
    exceedsLimit: "制限を超えています",
    cannotAddTokens: "トークンを追加できません",
  },
  ko: {
    cardTypeNotMatch: "카드 유형이 일치하지 않습니다",
    exceedsNumberCardsSameName: "동일한 이름의 카드 수를 초과합니다",
    limitCards: "카드 제한",
    exceedsLimit: "제한을 초과합니다",
    cannotAddTokens: "토큰을 추가할 수 없습니다",
  },
  es: {
    cardTypeNotMatch: "El Tipo de Carta no coincide",
    exceedsNumberCardsSameName:
      "Supera el número de cartas con el mismo nombre",
    limitCards: "Límite de cartas",
    exceedsLimit: "Supera el límite",
    cannotAddTokens: "No se pueden agregar fichas",
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
  /** 新卡追加到末尾，保留用户为不洗牌训练安排的现有顺序。 */
  add(type: Type, card: CardMeta) {
    editDeckStore[type].push(card);
    editDeckStore.edited = true;
  },
  /** 优先按位置删除指定副本，兼容没有索引的搜索和旧调用入口。 */
  remove(type: Type, card: CardMeta, index?: number) {
    const removeIndex =
      index ?? editDeckStore[type].findIndex((item) => item.id === card.id);
    if (editDeckStore[type][removeIndex]?.id === card.id) {
      editDeckStore[type].splice(removeIndex, 1);
      editDeckStore.edited = true;
    }
  },
  /** before 是删除源卡前的插入位置；向后移动时需扣除源卡占用的位置。 */
  reorder(type: Type, from: number, before: number) {
    const cards = editDeckStore[type];
    if (from < 0 || from >= cards.length || before < 0 || before > cards.length)
      return;
    const destination = before > from ? before - 1 : before;
    if (from === destination) return;
    const [card] = cards.splice(from, 1);
    cards.splice(destination, 0, card);
    editDeckStore.edited = true;
  },
  set(deck: EditingDeck) {
    editDeckStore.deckName = deck.deckName;
    editDeckStore.main = deck.main;
    editDeckStore.extra = deck.extra;
    editDeckStore.side = deck.side;
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
