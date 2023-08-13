import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { FtsParams } from "@/middleware/sqlite/fts";

export interface CardMeta {
  id: number;
  data: CardData;
  text: CardText;
}

export interface CardData {
  ot?: number;
  setcode?: number;
  type?: number;
  atk?: number;
  def?: number;
  level?: number;
  race?: number;
  attribute?: number;
  lscale?: number;
  rscale?: number;
}

export interface CardText {
  id?: number;
  name?: string;
  types?: string;
  desc?: string;
  str1?: string;
  str2?: string;
  str3?: string;
  str4?: string;
  str5?: string;
  str6?: string;
  str7?: string;
  str8?: string;
  str9?: string;
  str10?: string;
  str11?: string;
  str12?: string;
  str13?: string;
  str14?: string;
  str15?: string;
  str16?: string;
}

/*
 * 返回卡片元数据
 *
 * @param id - 卡片id
 * @returns 卡片数据
 *
 * */
export async function fetchCard(id: number): Promise<CardMeta> {
  const res = await sqliteMiddleWare({
    cmd: sqliteCmd.SELECT,
    payload: { id },
  });
  return res.selectResult ? res.selectResult : { id, data: {}, text: {} };
}

/*
 * 返回卡片元数据
 *
 * @param id - 卡片id
 * @returns 卡片数据
 *
 * */
export async function searchCards(params: FtsParams): Promise<CardMeta[]> {
  const res = await sqliteMiddleWare({
    cmd: sqliteCmd.FTS,
    payload: { ftsParams: params },
  });
  return res.ftsResult ?? [];
}

// @ts-ignore
window.fetchCard = fetchCard;
// @ts-ignore
window.searchCard = searchCards;

export function getCardStr(meta: CardMeta, idx: number): string | undefined {
  switch (idx) {
    case 0: {
      return meta.text.str1;
    }
    case 1: {
      return meta.text.str2;
    }
    case 2: {
      return meta.text.str3;
    }
    case 3: {
      return meta.text.str4;
    }
    case 4: {
      return meta.text.str5;
    }
    case 5: {
      return meta.text.str6;
    }
    case 6: {
      return meta.text.str7;
    }
    case 7: {
      return meta.text.str8;
    }
    case 8: {
      return meta.text.str9;
    }
    case 9: {
      return meta.text.str10;
    }
    case 10: {
      return meta.text.str11;
    }
    case 11: {
      return meta.text.str12;
    }
    case 12: {
      return meta.text.str13;
    }
    case 13: {
      return meta.text.str14;
    }
    case 14: {
      return meta.text.str15;
    }
    case 15: {
      return meta.text.str16;
    }
    default: {
      return undefined;
    }
  }
}
