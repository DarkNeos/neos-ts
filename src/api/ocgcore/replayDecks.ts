import type { IDeck } from "@/stores/deckStore";

import { parseYrp3dRecords } from "./replay";
import { runReplayWorker } from "./replayWorker";
import { isYrp } from "./yrp";

export interface ReplayDeck extends IDeck {
  player: string;
  game: number;
  /** 是否所有记录都有卡号；缺失项不会通过公开动作推断或补齐。 */
  complete: boolean;
  expectedMain: number;
  expectedExtra: number;
}

/** 读取服务器内嵌卡组并保留缺失标记；没有内嵌数据时不根据公开动作推断。 */
export async function extractReplayDecks(
  buffer: ArrayBuffer,
  signal?: AbortSignal,
) {
  if (isYrp(buffer)) return (await runReplayWorker(buffer, { signal })).decks;
  const records = parseYrp3dRecords(buffer);
  const decks: ReplayDeck[] = [];
  let game = 0;
  for (const record of records) {
    if (record.func === 4) game += 1;
    // 231 对应服务器提供的内嵌 YRP，按开局记录将卡组归属到各局。
    if (record.func === 231)
      decks.push(
        ...(
          await runReplayWorker(record.data, {
            game: Math.max(1, game),
            signal,
          })
        ).decks,
      );
  }
  return decks;
}
