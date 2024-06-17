import { useConfig } from "@/config";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { FtsParams } from "@/middleware/sqlite/fts";

import { isSuperReleaseCard } from "./superPreRelease";

const NeosConfig = useConfig();

export interface CardMeta {
  id: number;
  data: CardData;
  text: CardText;
}

export interface CardData {
  alias?: number;
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

export type CardStrRange = `str${IntRange<1, 17>}`;

export type CardText = {
  id?: number;
  name?: string;
  types?: string;
  desc?: string;
} & {
  [str in CardStrRange]?: string;
};

/*
 * 返回卡片元数据
 *
 * @param id - 卡片id
 * @returns 卡片数据
 *
 * */
export function fetchCard(id: number): CardMeta {
  const res = sqliteMiddleWare({
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
export function searchCards(params: FtsParams): CardMeta[] {
  const res = sqliteMiddleWare({
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
  const str = `str${idx + 1}` as CardStrRange;
  return meta.text[str];
}

export function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL === "/"
      ? NeosConfig.assetsPath
      : `${import.meta.env.BASE_URL}${NeosConfig.assetsPath}`;
  if (back || code === 0) {
    return `${ASSETS_BASE}/card_back.jpg`;
  }

  if (isSuperReleaseCard(code)) {
    return `${NeosConfig.preReleaseImgUrl}/${code}.jpg`;
  } else {
    const language = localStorage.getItem("language");
    if (
      language === "en" ||
      language === "br" ||
      language === "pt" ||
      language === "fr" ||
      language === "es"
    ) {
      NeosConfig.releaseImgUrl = NeosConfig.releaseImgUrl.replace(
        "zh-CN",
        "en-US",
      );
    }
    return `${NeosConfig.releaseImgUrl}/${code}.jpg`;
  }
}
