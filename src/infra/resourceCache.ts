import { get, set } from "idb-keyval";

import { pfetch, ResourceHttpError } from "./pfetch";

interface CachedResource {
  bytes: ArrayBuffer | null;
  savedAt: number;
  version?: string;
}
const MAX_AGE = 24 * 60 * 60 * 1000;

interface CachedBinaryOptions {
  signal?: AbortSignal;
  progress?: (progress: number) => void;
  validate?: (bytes: ArrayBuffer) => void;
  /** 版本变化时刷新，下载失败仍保留旧版本供下次重试。 */
  version?: string;
  /** 缓存可选脚本的 404；其他 HTTP 错误仍按失败处理。 */
  allowNotFound?: boolean;
}

export function cachedBinary(
  url: string,
  options?: CachedBinaryOptions & { allowNotFound?: false },
): Promise<ArrayBuffer>;
export function cachedBinary(
  url: string,
  options: CachedBinaryOptions & { allowNotFound: boolean },
): Promise<ArrayBuffer | null>;
/** 缓存完整下载的资源；更新失败时允许使用上一份完整缓存。 */
export async function cachedBinary(
  url: string,
  options: CachedBinaryOptions = {},
): Promise<ArrayBuffer | null> {
  const key = `neos-replay-resource-v1:${url}`;
  let cached: CachedResource | undefined;
  try {
    cached = await get<CachedResource>(key);
    if (cached?.bytes === null && !options.allowNotFound) cached = undefined;
    if (cached?.bytes) options.validate?.(cached.bytes);
  } catch {
    cached = undefined;
  }
  if (options.signal?.aborted) throw new Error("资源加载已取消");
  if (
    cached &&
    (options.version === undefined || cached.version === options.version) &&
    Date.now() - cached.savedAt < MAX_AGE
  ) {
    options.progress?.(1);
    return cached.bytes;
  }
  const save = async (bytes: ArrayBuffer | null) => {
    try {
      await set(key, { bytes, savedAt: Date.now(), version: options.version });
    } catch {
      /* 缓存失败不影响本次播放。 */
    }
  };
  try {
    let requestUrl = url;
    if (options.version !== undefined) {
      const versioned = new URL(url, globalThis.location.href);
      versioned.searchParams.set("v", options.version);
      requestUrl = versioned.href;
    }
    const response = await pfetch(requestUrl, {
      chunkSize: 5_000_000,
      init: {
        signal: options.signal,
        cache: options.version === undefined ? undefined : "no-cache",
      },
      progressCallback: options.progress,
    });
    const bytes = await response.arrayBuffer();
    options.validate?.(bytes);
    await save(bytes);
    return bytes;
  } catch (error) {
    if (
      !options.signal?.aborted &&
      options.allowNotFound &&
      error instanceof ResourceHttpError &&
      error.status === 404
    ) {
      if (cached?.bytes) return cached.bytes;
      await save(null);
      return null;
    }
    if (cached && !options.signal?.aborted) return cached.bytes;
    throw error;
  }
}
