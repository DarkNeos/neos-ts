import type { CardDatabaseResources } from "./cardSources";
import type { ReplayDeck } from "./replayDecks";

export interface ReplayResources {
  scripts: ArrayBuffer[];
  preReleaseScriptsUrl?: string;
  preReleaseVersionUrl?: string;
  databases: CardDatabaseResources;
  sqlWasm: ArrayBuffer;
}

export interface ReplayWorkerResult {
  decks: ReplayDeck[];
  replay?: ArrayBuffer;
}

export function runReplayWorker(
  data: ArrayBuffer,
  options: {
    game?: number;
    resources?: ReplayResources;
    signal?: AbortSignal;
    onProgress?: (text: string) => void;
  } = {},
): Promise<ReplayWorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./replayYrp.worker.ts", import.meta.url),
      { type: "module" },
    );
    const timeout = setTimeout(
      () =>
        finish(
          new Error(
            options.resources ? "本地录像演算超时" : "录像卡组解压超时",
          ),
        ),
      options.resources ? 120_000 : 15_000,
    );
    const abort = () => finish(new Error("录像加载已取消"));
    let finished = false;
    const finish = (error?: Error, result?: ReplayWorkerResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
      worker.terminate();
      if (error) reject(error);
      else resolve(result!);
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) return abort();
    worker.onerror = () =>
      finish(new Error("录像处理失败，请检查录像格式和资源"));
    worker.onmessage = ({ data: response }) => {
      if (response.progress) options.onProgress?.(response.progress);
      else if (response.error) finish(new Error(response.error));
      else finish(undefined, response.result);
    };
    // 保留原文件，提取卡组与重新播放都可能再次使用。
    worker.postMessage({
      data,
      game: options.game ?? 1,
      resources: options.resources,
    });
  });
}
