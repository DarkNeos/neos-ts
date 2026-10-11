import { parseYrp3dRecords } from "@/api/ocgcore/replay";
import { extractReplayDecks, type ReplayDeck } from "@/api/ocgcore/replayDecks";
import { isYrp } from "@/api/ocgcore/yrp";
import { ReplayImportSession } from "@/stores/replayImportSession";
import { replayStore } from "@/stores/replayStore";
import { initializeApp } from "@/ui/Layout/utils";
import { connectSrvpro } from "@/ui/Match/util";

export const replayImport = new ReplayImportSession<ReplayDeck>({
  async prepare(data, mode, options) {
    let decks: ReplayDeck[] = [];
    let deckError = "";
    if (mode === "play") {
      options.onProgress?.("正在加载卡片数据库");
      await initializeApp();
      options.signal?.throwIfAborted();
    }
    if (mode === "play" && isYrp(data)) {
      const { renderLocalReplay } = await import("@/api/ocgcore/localReplay");
      const result = await renderLocalReplay(data, options);
      if (!result.replay) throw new Error("本地录像演算没有生成播放数据");
      data = result.replay;
      decks = result.decks;
    } else {
      try {
        decks = await extractReplayDecks(data, options.signal);
      } catch (error) {
        options.signal?.throwIfAborted();
        deckError = error instanceof Error ? error.message : "卡组提取失败";
      }
    }
    options.signal?.throwIfAborted();
    if (
      mode === "play" &&
      !parseYrp3dRecords(data).some((record) => record.func === 4)
    )
      throw new Error("录像没有开局数据，无法播放");
    return { decks, deckError, replay: mode === "play" ? data : undefined };
  },
  publishDecks({ decks, deckError }) {
    replayStore.decks = decks;
    replayStore.deckError = deckError;
  },
  startPlayback(data, signal) {
    replayStore.beginReplay();
    return connectSrvpro({
      ip: "",
      player: "",
      passWd: "",
      replay: true,
      replayData: data,
      signal,
    });
  },
});
