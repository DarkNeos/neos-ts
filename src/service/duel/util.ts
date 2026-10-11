import { ygopro } from "@/api";
const { MZONE, SZONE, HAND } = ygopro.CardZone;
import { fetchStrings } from "@/api";
import { Region } from "@/api";
import { fetchCard } from "@/api/cards";
import { formatCardName } from "@/api/cardText";
import { Context } from "@/container";

export function isAllOnField(locations: ygopro.CardLocation[]): boolean {
  const isOnField = (location: ygopro.CardLocation) => {
    return !location.is_overlay && [MZONE, SZONE, HAND].includes(location.zone);
  };

  return locations.find((location) => !isOnField(location)) === undefined;
}

export function computeSetDifference(set1: number[], set2: number[]): number[] {
  const freq1 = new Map<number, number>();
  const freq2 = new Map<number, number>();

  for (const num of set1) {
    freq1.set(num, (freq1.get(num) || 0) + 1);
  }
  for (const num of set2) {
    freq2.set(num, (freq2.get(num) || 0) + 1);
  }

  for (const [num, count] of freq2) {
    if (freq1.has(num)) {
      freq1.set(num, freq1.get(num)! - count);
    }
  }
  const difference: number[] = [];
  for (const [num, count] of freq1) {
    if (count > 0) {
      difference.push(...Array(count).fill(num));
    }
  }

  return difference;
}

export function argmax<T>(arr: T[], getValue: (item: T) => number): number {
  if (arr.length === 0) {
    throw new Error("Array is empty");
  }

  let maxIndex = 0;
  let maxValue = getValue(arr[0]);

  for (let i = 1; i < arr.length; i++) {
    const currentValue = getValue(arr[i]);
    if (currentValue > maxValue) {
      maxValue = currentValue;
      maxIndex = i;
    }
  }

  return maxIndex;
}

export const fetchEsHintMeta = async ({
  context,
  originMsg,
  location,
  cardID,
}: {
  context: Context;
  originMsg: string | number;
  location?: ygopro.CardLocation;
  cardID?: number;
}) => {
  const newOriginMsg =
    typeof originMsg === "string"
      ? originMsg
      : fetchStrings(Region.System, originMsg);

  const cardMeta = cardID ? fetchCard(cardID) : undefined;

  let esHint = newOriginMsg;

  const cardName = cardMeta?.text.name;
  if (cardName) {
    esHint = formatCardName(esHint, cardName, "[?]");
  }

  if (location) {
    const fieldMeta = context.cardStore.at(
      location.zone,
      location.controller,
      location.sequence,
    );
    // 存在具体场上卡片时，再用其当前元数据替换提示中的占位卡名。
    const fieldName = fieldMeta?.meta.text.name;
    if (fieldName) {
      esHint = formatCardName(esHint, fieldName, "[?]");
    }
  }

  context.matStore.hint.esHint = esHint;
};
