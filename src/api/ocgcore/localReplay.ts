import { useConfig } from "@/config";
import { cachedBinary } from "@/infra/resourceCache";
import { getReplaySqlResources } from "@/middleware/sqlite";

import { runReplayWorker } from "./replayWorker";

export async function renderLocalReplay(
  data: ArrayBuffer,
  options: {
    signal?: AbortSignal;
    onProgress?: (text: string) => void;
  } = {},
) {
  const { localReplay, preReleaseResource } = useConfig();
  let scripts: ArrayBuffer | undefined;
  for (const url of localReplay.scripts) {
    try {
      scripts = await cachedBinary(url, {
        signal: options.signal,
        progress: (progress) =>
          options.onProgress?.(
            `正在加载录像脚本：${Math.round(progress * 100)}%`,
          ),
        validate: (bytes) => {
          const view = new Uint8Array(bytes);
          if (
            view.length > 64 * 1024 * 1024 ||
            view[0] !== 0x50 ||
            view[1] !== 0x4b
          )
            throw new Error("录像脚本包格式无效");
        },
      });
      break;
    } catch (error) {
      if (options.signal?.aborted || url === localReplay.scripts.at(-1))
        throw error;
    }
  }
  if (!scripts) throw new Error("未配置本地录像脚本资源");
  options.onProgress?.("正在准备本地对局内核");
  return runReplayWorker(data, {
    ...options,
    resources: {
      ...getReplaySqlResources(),
      scripts: [scripts],
      preReleaseScriptsUrl: preReleaseResource.scripts,
      preReleaseVersionUrl: preReleaseResource.version,
    },
  });
}
