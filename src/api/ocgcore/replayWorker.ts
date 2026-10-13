import type { CardDatabaseResources } from "./cardSources";
import type { ReplayDeck } from "./replayDecks";
import replayWorkerUrl from "./replayYrp.worker.ts?worker&url";

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
    let worker: Worker | undefined;
    let blobUrl: string | undefined;
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
      worker?.terminate();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (error) reject(error);
      else resolve(result!);
    };
    if (options.signal?.aborted) return abort();
    try {
      const url = new URL(replayWorkerUrl, location.href);
      if (url.origin !== location.origin) {
        // Worker 入口必须同源；Blob 引导后由模块加载器读取 CDN 资源。
        blobUrl = URL.createObjectURL(
          new Blob([`import ${JSON.stringify(url.href)};`], {
            type: "text/javascript",
          }),
        );
      }
      worker = new Worker(blobUrl ?? url, { type: "module" });
      options.signal?.addEventListener("abort", abort, { once: true });
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
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
