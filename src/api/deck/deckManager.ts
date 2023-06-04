const DECKS: Record<string, { default: IDeck }> = import.meta.glob(
  "/neos-assets/structure-decks/*.ydk",
  {
    eager: true,
  }
);

export const DeckManager = _objToMap(
  Object.keys(DECKS).map((key) => ({
    ...DECKS[key].default,
    deckName:
      key.split("/").pop()?.split(".").slice(0, -1).join(".") ?? "undefined",
  }))
);

/*
 * 返回卡组资源。
 *
 * @param deck- 卡组名称
 * @returns 卡组数据
 *
 * @todo - 这里应该为萌卡实现卡组存储
 * */
export async function fetchDeck(deck: string): Promise<IDeck> {
  const res = DeckManager.get(deck);

  if (!res) {
    console.error(`Deck ${deck} doesn't exist.`);
  }

  return res ?? { deckName: "undefined", main: [], extra: [], side: [] };
}

function _objToMap(object: IDeck[]): Map<string, IDeck> {
  const map: Map<string, IDeck> = new Map();

  object.forEach((value) => map.set(value.deckName, value));

  return map;
}

export interface IDeck {
  deckName: string;
  main: number[];
  extra: number[];
  side: number[];
}
