import { Attribute2StringCodeMap, Race2StringCodeMap } from "@/common";

import { fetchCard } from "./cards";
import { ygopro } from "./ocgcore/idl/ocgcore";
import { fetchStrings, getStrings, Region } from "./strings";

export const CARD_QUESTION = 38723936;

export function isGraveInspectionBlocked(
  location: Pick<ygopro.CardLocation, "zone" | "controller"> | undefined,
  state: {
    isMe: (controller: number) => boolean;
    playerHints: Readonly<Record<number, Readonly<Record<number, number>>>>;
  },
): boolean {
  return (
    location?.zone === ygopro.CardZone.GRAVE &&
    state.isMe(location.controller) &&
    !!state.playerHints[location.controller]?.[CARD_QUESTION]
  );
}

/** 区域掩码以前半段表示提示玩家一侧，后半段表示另一侧。 */
export function hintZones(value: number, player: number) {
  const zones: {
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  }[] = [];
  for (let side = 0; side < 2; side++) {
    for (const [zone, count, offset] of [
      [ygopro.CardZone.MZONE, 7, 0],
      [ygopro.CardZone.SZONE, 8, 8],
    ]) {
      for (let sequence = 0; sequence < count; sequence++) {
        if (value & (1 << (side * 16 + offset + sequence)))
          zones.push({ controller: player ^ side, zone, sequence });
      }
    }
  }
  return zones;
}

export function maskHintText(value: number, kind: "race" | "attribute") {
  const map = kind === "race" ? Race2StringCodeMap : Attribute2StringCodeMap;
  return [...map]
    .filter(([bit]) => value & bit)
    .map(([bit, code]) => {
      const text = fetchStrings(Region.System, code);
      return text !== "?"
        ? text
        : kind === "attribute"
        ? ["地", "水", "炎", "风", "光", "暗", "神"][Math.log2(bit)]
        : `种族 ${Math.log2(bit) + 1}`;
    })
    .join(" / ");
}

export function cardHintText(hint: { type: number; value: number }) {
  switch (hint.type) {
    case 1:
      return `回合计数：${hint.value}`;
    case 2:
      return `宣言卡名：${fetchCard(hint.value).text.name || hint.value}`;
    case 3:
      return `宣言种族：${maskHintText(hint.value, "race")}`;
    case 4:
      return `宣言属性：${maskHintText(hint.value, "attribute")}`;
    case 5:
      return `宣言数字：${hint.value}`;
    default:
      return "";
  }
}

export function descriptionHintText(value: number) {
  if (value === CARD_QUESTION) return "暂不能查看自己的墓地";
  const text = getStrings(value);
  return text !== "?" && text !== "[?]" ? text : `效果说明 ${value}`;
}
