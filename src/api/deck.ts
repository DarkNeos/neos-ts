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

export function parseYdk(text: string): IDeck | undefined {
  const lineIter = text.split("\n");
  const deck: { main: number[]; extra: number[]; side: number[] } = {
    main: [],
    extra: [],
    side: [],
  };

  let flag = -1;

  for (const line of lineIter) {
    switch (line) {
      case "#main\r": {
        flag = 1;
        break;
      }
      case "#extra\r": {
        flag = 2;
        break;
      }
      case "!side\r": {
        flag = 3;
        break;
      }
      default: {
        let code = Number(line);
        if (!isNaN(code)) {
          if (code > 100) {
            switch (flag) {
              case 1: {
                deck.main.push(code);
                break;
              }
              case 2: {
                deck.extra.push(code);
                break;
              }
              case 3: {
                deck.side.push(code);
                break;
              }
              default: {
                break;
              }
            }
          }
        }
        break;
      }
    }
  }

  return deck.main.length == 0 ? undefined : deck;
}
