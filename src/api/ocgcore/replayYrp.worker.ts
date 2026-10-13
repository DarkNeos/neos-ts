import type { ReplayResources, ReplayWorkerResult } from "./replayWorker";
import { parseYrp, yrpDecks } from "./yrp";

self.onmessage = async ({
  data: request,
}: MessageEvent<{
  data: ArrayBuffer;
  game: number;
  resources?: ReplayResources;
}>) => {
  try {
    const yrp = parseYrp(request.data, !request.resources);
    const result: ReplayWorkerResult = { decks: yrpDecks(yrp, request.game) };
    if (request.resources) {
      const { renderYrp } = await import("./localReplayEngine");
      result.replay = await renderYrp(
        yrp,
        request.data,
        request.resources,
        (progress) => self.postMessage({ progress }),
      );
    }
    self.postMessage(
      { result },
      result.replay ? { transfer: [result.replay] } : undefined,
    );
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "录像处理失败",
    });
  }
};
