import { decompress } from "@cjser/lzma1";
import { DUEL_TAG_MODE, YGOProYrp } from "ygopro-yrp-encode";

import type { ReplayDeck } from "./replayDecks";

export const MAX_YRP_SIZE = 16 * 1024 * 1024;

export function isYrp(data: ArrayBuffer) {
  if (data.byteLength < 4) return false;
  return [0x31707279, 0x32707279].includes(
    new DataView(data).getUint32(0, true),
  );
}

/** 库允许部分计数和响应被截断；入口先校验边界，不读取卡号或业务字段。 */
function validateBody(body: Uint8Array, flags: number, decksOnly: boolean) {
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  let offset = (flags & 2 ? 160 : 80) + 16;
  const requireBytes = (length: number) => {
    if (offset + length > body.length)
      throw new Error("录像卡组或操作记录不完整");
  };
  requireBytes(0);
  if (flags & 8) {
    requireBytes(2);
    const length = view.getUint16(offset, true);
    offset += 2;
    requireBytes(length);
    offset += length;
  } else {
    for (let pack = 0; pack < (flags & 2 ? 8 : 4); pack++) {
      requireBytes(4);
      const count = view.getInt32(offset, true);
      if (count < 0 || count > 500) throw new Error("录像卡组张数无效");
      offset += 4;
      requireBytes(count * 4);
      offset += count * 4;
    }
  }
  if (decksOnly) return;
  while (offset < body.length) {
    const length = body[offset++];
    if (!length || length > 64) throw new Error("录像操作记录长度无效");
    requireBytes(length);
    offset += length;
  }
}

/** 在 Worker 中调用；先限制并核对解压数据，再交给库读取录像结构。 */
export function parseYrp(data: ArrayBuffer, decksOnly = false): YGOProYrp {
  if (!isYrp(data)) throw new Error("无法识别 YRP/YRP2 录像格式");
  if (data.byteLength < 32) throw new Error("录像的卡组数据头不完整");
  const view = new DataView(data);
  const headerLength = view.getUint32(0, true) === 0x32707279 ? 80 : 32;
  const size = view.getUint32(16, true);
  const flags = view.getUint32(8, true);
  if (
    size > MAX_YRP_SIZE ||
    data.byteLength < headerLength ||
    data.byteLength > MAX_YRP_SIZE + headerLength
  )
    throw new Error("录像卡组数据大小无效");
  let body = new Uint8Array(data.slice(headerLength));
  if (flags & 1) {
    const compressed = new Uint8Array(13 + body.length);
    compressed.set(new Uint8Array(data, 24, 5));
    new DataView(compressed.buffer).setUint32(5, size, true);
    compressed.set(body, 13);
    body = decompress(compressed);
  }
  if (body.length !== size) throw new Error("录像卡组数据长度不符");
  validateBody(body, flags, decksOnly);
  const normalized = new Uint8Array(headerLength + body.length);
  normalized.set(new Uint8Array(data, 0, headerLength));
  normalized.set(body, headerLength);
  new DataView(normalized.buffer).setUint32(8, flags & ~1, true);
  // 历史服务器卡组附件的 TAG 参数可能为空，提取时以文件头的玩家数为准。
  if (decksOnly && flags & 2) {
    const params = headerLength + 4 * 40 + 12;
    if (params + 4 <= normalized.length) {
      const bytes = new DataView(normalized.buffer);
      bytes.setInt32(
        params,
        bytes.getInt32(params, true) | DUEL_TAG_MODE,
        true,
      );
    }
  }
  const yrp = new YGOProYrp().fromYrp(normalized);
  for (const deck of [
    yrp.hostDeck,
    yrp.tagHostDeck,
    yrp.tagClientDeck,
    yrp.clientDeck,
  ]) {
    if (deck && (deck.main.length > 500 || deck.extra.length > 500))
      throw new Error("录像卡组张数无效");
  }
  return yrp;
}

export function yrpDecks(yrp: YGOProYrp, game: number): ReplayDeck[] {
  const players = [
    { name: yrp.hostName, deck: yrp.hostDeck },
    ...(yrp.isTag
      ? [
          { name: yrp.tagHostName, deck: yrp.tagHostDeck },
          { name: yrp.tagClientName, deck: yrp.tagClientDeck },
        ]
      : []),
    { name: yrp.clientName, deck: yrp.clientDeck },
  ];
  return players.flatMap(({ name, deck }, index) => {
    if (!deck) return [];
    const player = name || `玩家 ${index + 1}`;
    return [
      {
        player,
        game,
        deckName: `录像 ${game} - ${player}`,
        main: deck.main.filter(Boolean),
        extra: deck.extra.filter(Boolean),
        side: [],
        complete: deck.main.every(Boolean) && deck.extra.every(Boolean),
        expectedMain: deck.main.length,
        expectedExtra: deck.extra.length,
      },
    ];
  });
}
