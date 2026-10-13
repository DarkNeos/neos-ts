import { useConfig } from "@/config";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { FtsParams } from "@/middleware/sqlite/fts";

import { formatCardName } from "./cardText";
import { isSuperReleaseCard } from "./superPreRelease";

const { assetsPath, releaseResource, preReleaseResource } = useConfig();

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
  rank?: number;
  link?: number;
  linkMarkers?: number;
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

/** 按实时 alias 显示卡名，数据库中的同名卡别名不视为效果改名。 */
export function getCardDisplayName(meta: CardMeta, originalData?: CardData) {
  const originalName = { name: meta.text.name, renamed: false };
  const alias = meta.data.alias ?? 0;
  // 只把对局中新出现的 alias 视为效果改名，异画卡沿用原卡名。
  if (
    meta.id === 0 ||
    alias <= 0 ||
    alias === meta.id ||
    alias === (originalData ?? fetchCard(meta.id).data).alias
  )
    return originalName;

  const name = fetchCard(alias).text.name;
  return name ? { name, renamed: true } : originalName;
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
  const text = meta.text[str];
  // 效果选项沿用原数据库文本，只统一其中的卡名标记。
  return text === undefined
    ? undefined
    : formatCardName(text, meta.text.name ?? "");
}

/** 按当前语言读取正式卡图，超先行卡沿用 JPG 资源。 */
export function getCardImgUrl(code: number, back = false) {
  const ASSETS_BASE =
    import.meta.env.BASE_URL === "/"
      ? assetsPath
      : `${import.meta.env.BASE_URL}${assetsPath}`;
  if (back || code === 0) {
    return `${ASSETS_BASE}/card_back.webp`;
  } else if (isSuperReleaseCard(code)) {
    // 超先行资源只提供 JPG，不能沿用正式卡图的 WebP 后缀。
    return `${preReleaseResource.img}/${code}.jpg`;
  } else {
    // Define translations for different languages (I18N)
    const language = localStorage.getItem("language");
    let imgUrl;

    switch (language) {
      case "en":
      case "br":
      case "pt":
      case "fr":
      case "es":
        imgUrl = releaseResource.img.replace("zh-CN", "en-US");
        break;
      default:
        imgUrl = releaseResource.img;
        break;
    }
    /* End of definition (I18N) */

    return `${imgUrl}/${code}.webp`;
  }
}
