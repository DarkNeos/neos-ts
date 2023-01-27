// import axios from "axios";
import DECKS from "./deck.json";

const DeckManager = _objToMap(DECKS);

export interface IDeck {
  main?: number[];
  extra?: number[];
  side?: number[];
}

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

  return res || { main: [], extra: [], side: [] };
}

function _objToMap(object: any): Map<string, IDeck> {
  let map = new Map();

  Object.keys(object).forEach((key) => map.set(key, object[key]));

  return map;
}
