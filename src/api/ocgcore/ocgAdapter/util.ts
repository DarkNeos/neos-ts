/*
 * 一些基础函数。
 *
 * */

import {
  QUERY_ALIAS,
  QUERY_ATTACK,
  QUERY_ATTRIBUTE,
  QUERY_BASE_ATTACK,
  QUERY_BASE_DEFENSE,
  QUERY_CODE,
  QUERY_COUNTERS,
  QUERY_DEFENSE,
  QUERY_EQUIP_CARD,
  QUERY_LEVEL,
  QUERY_LINK,
  QUERY_LSCALE,
  QUERY_OVERLAY_CARD,
  QUERY_OWNER,
  QUERY_POSITION,
  QUERY_RACE,
  QUERY_RANK,
  QUERY_REASON,
  QUERY_REASON_CARD,
  QUERY_RSCALE,
  QUERY_STATUS,
  QUERY_TARGET_CARD,
  QUERY_TYPE,
} from "../../../common";
import { ygopro } from "../idl/ocgcore";
import { BufferReaderExt } from "./bufferIO";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

export const UTF16_BUFFER_MAX_LEN = 20;
const FILLING_TOKEN: number = 0xcccc;

/*
 * 将`string`类型字符串转成`utf-16`编码的二进制数组。
 *
 * @param str - The `string` type string
 * @returns The `utf-16` `Uint8Array`
 *
 * */
export function strEncodeUTF16(str: string) {
  let buf = new ArrayBuffer(UTF16_BUFFER_MAX_LEN * 2);
  let bufView = new Uint16Array(buf);
  bufView.fill(FILLING_TOKEN, 0, UTF16_BUFFER_MAX_LEN);

  for (
    let i = 0, strLen = str.length;
    i < strLen && i < UTF16_BUFFER_MAX_LEN;
    i++
  ) {
    bufView[i] = str.charCodeAt(i);

    if (i === strLen - 1 && i < bufView.length - 1) {
      bufView[i + 1] = 0;
    }
  }
  return new Uint8Array(buf);
}

// currently not used, but remain.
export function utf8ArrayToStr(array: Uint8Array) {
  let out, i, len, c;
  let char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0),
        );
        break;
    }
  }

  return out;
}

export function cardZoneToNumber(zone: ygopro.CardZone): number {
  switch (zone) {
    case ygopro.CardZone.DECK: {
      return 0x01;
    }
    case ygopro.CardZone.HAND: {
      return 0x02;
    }
    case ygopro.CardZone.MZONE: {
      return 0x04;
    }
    case ygopro.CardZone.SZONE: {
      return 0x08;
    }
    case ygopro.CardZone.GRAVE: {
      return 0x10;
    }
    case ygopro.CardZone.REMOVED: {
      return 0x20;
    }
    case ygopro.CardZone.EXTRA: {
      return 0x40;
    }
    case ygopro.CardZone.ONFIELD: {
      return 0x0c;
    }
    case ygopro.CardZone.FZONE: {
      return 0x100;
    }
    case ygopro.CardZone.PZONE: {
      return 0x200;
    }
    case ygopro.CardZone.TZONE: {
      return 0x300;
    }
  }
}

export function numberToCardZone(
  location: number,
): ygopro.CardZone | undefined {
  switch (location) {
    case 0x01: {
      return ygopro.CardZone.DECK;
    }
    case 0x02: {
      return ygopro.CardZone.HAND;
    }
    case 0x04: {
      return ygopro.CardZone.MZONE;
    }
    case 0x08: {
      return ygopro.CardZone.SZONE;
    }
    case 0x10: {
      return ygopro.CardZone.GRAVE;
    }
    case 0x20: {
      return ygopro.CardZone.REMOVED;
    }
    case 0x40: {
      return ygopro.CardZone.EXTRA;
    }
    case 0x0c: {
      return ygopro.CardZone.ONFIELD;
    }
    case 0x100: {
      return ygopro.CardZone.FZONE;
    }
    case 0x200: {
      return ygopro.CardZone.PZONE;
    }
    default: {
      return undefined;
    }
  }
}

// TODO: 需要考虑超量叠加情况下的位运算
export function numberToCardPosition(
  position: number,
): ygopro.CardPosition | undefined {
  switch (position) {
    case 0x1: {
      return ygopro.CardPosition.FACEUP_ATTACK;
    }
    case 0x2: {
      return ygopro.CardPosition.FACEDOWN_ATTACK;
    }
    case 0x3: {
      return ygopro.CardPosition.ATTACK;
    }
    case 0x4: {
      return ygopro.CardPosition.FACEUP_DEFENSE;
    }
    case 0x5: {
      return ygopro.CardPosition.FACEUP;
    }
    case 0x8: {
      return ygopro.CardPosition.FACEDOWN_DEFENSE;
    }
    case 0xa: {
      return ygopro.CardPosition.FACEDOWN;
    }
    case 0xc: {
      return ygopro.CardPosition.DEFENSE;
    }
    default: {
      return undefined;
    }
  }
}

export function numberToChainFlag(
  flag: number,
): ygopro.StocGameMessage.MsgSelectChain.ChainFlag | undefined {
  switch (flag) {
    case 0: {
      return ygopro.StocGameMessage.MsgSelectChain.ChainFlag.COMMON;
    }
    case 1: {
      return ygopro.StocGameMessage.MsgSelectChain.ChainFlag.EDESC_OPERATION;
    }
    case 2: {
      return ygopro.StocGameMessage.MsgSelectChain.ChainFlag.EDESC_RESET;
    }
    default: {
      return undefined;
    }
  }
}

const chunkItems = <T>(items: T[]) =>
  items.reduce((chunks: T[][], item: T, index) => {
    const chunk = Math.floor(index / 2);
    chunks[chunk] = ([] as T[]).concat(chunks[chunk] || [], item);
    return chunks;
  }, []);

export function _cutoff_name(data: Uint8Array): Uint8Array {
  let res: number[] = [];
  for (const char of chunkItems(Array.from(data))) {
    if (!char.every((item) => item === 0)) {
      res = res.concat(char);
    } else {
      break;
    }
  }
  return Uint8Array.from(res);
}

export function readUpdateAction(
  reader: BufferReaderExt,
): MsgUpdateData.Action | undefined {
  const flag = reader.inner.readInt32();
  if (flag === 0) return undefined;

  const mask = -1;
  let code = mask;
  let location = undefined;
  let alias = mask;
  let type_ = mask;
  let level = mask;
  let rank = mask;
  let attribute = mask;
  let race = mask;
  let attack = mask;
  let defense = mask;
  let base_attack = mask;
  let base_defense = mask;
  let reason = mask;
  let reason_card = mask;
  let equip_card;
  let target_cards = [];
  let overlay_cards = [];
  let counters = new Map<number, number>();
  let owner = mask;
  let status = mask;
  let lscale = mask;
  let rscale = mask;
  let link = mask;

  if (flag & QUERY_CODE) {
    code = reader.inner.readInt32();
  }
  if (flag & QUERY_POSITION) {
    location = reader.readCardLocation();
  }
  if (flag & QUERY_ALIAS) {
    alias = reader.inner.readInt32();
  }
  if (flag & QUERY_TYPE) {
    type_ = reader.inner.readInt32();
  }
  if (flag & QUERY_LEVEL) {
    level = reader.inner.readInt32();
  }
  if (flag & QUERY_RANK) {
    rank = reader.inner.readInt32();
  }
  if (flag & QUERY_ATTRIBUTE) {
    attribute = reader.inner.readInt32();
  }
  if (flag & QUERY_RACE) {
    race = reader.inner.readInt32();
  }
  if (flag & QUERY_ATTACK) {
    attack = reader.inner.readInt32();
  }
  if (flag & QUERY_DEFENSE) {
    defense = reader.inner.readInt32();
  }
  if (flag & QUERY_BASE_ATTACK) {
    base_attack = reader.inner.readInt32();
  }
  if (flag & QUERY_BASE_DEFENSE) {
    base_defense = reader.inner.readInt32();
  }
  if (flag & QUERY_REASON) {
    reason = reader.inner.readInt32();
  }
  if (flag & QUERY_REASON_CARD) {
    reason_card = reader.inner.readInt32();
  }
  if (flag & QUERY_EQUIP_CARD) {
    equip_card = reader.readCardLocation();
  }
  if (flag & QUERY_TARGET_CARD) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      target_cards.push(reader.readCardLocation());
    }
  }
  if (flag & QUERY_OVERLAY_CARD) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      overlay_cards.push(reader.inner.readInt32());
    }
  }
  if (flag & QUERY_COUNTERS) {
    const count = reader.inner.readInt32();
    for (let i = 0; i < count; i += 1) {
      const ctype = reader.inner.readUint16();
      const ccount = reader.inner.readUint16();
      counters.set(ctype, ccount);
    }
  }
  if (flag & QUERY_OWNER) {
    owner = reader.inner.readInt32();
  }
  if (flag & QUERY_STATUS) {
    status = reader.inner.readInt32();
  }
  if (flag & QUERY_LSCALE) {
    lscale = reader.inner.readInt32();
  }
  if (flag & QUERY_RSCALE) {
    rscale = reader.inner.readInt32();
  }
  if (flag & QUERY_LINK) {
    link = reader.inner.readInt32();
  }

  return new MsgUpdateData.Action({
    code,
    location,
    alias,
    type_,
    level,
    rank,
    attribute,
    race,
    attack,
    defense,
    base_attack,
    base_defense,
    reason,
    reason_card,
    equip_card,
    target_cards,
    overlay_cards,
    counters,
    owner,
    status,
    lscale,
    rscale,
    link,
  });
}
