interface FetchOptions {
  init?: RequestInit;
  progressCallback?: (progress: number) => void;
  timeoutMs?: number;
  /** 启用 HTTP Range 下载，每段的最大字节数。 */
  chunkSize?: number;
}

export class ResourceHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`资源请求失败（HTTP ${status}）`);
    this.name = "ResourceHttpError";
    this.status = status;
  }
}

/** 下载完整资源并报告进度；分段模式下每段分别计时。 */
export async function pfetch(
  input: RequestInfo,
  options?: FetchOptions,
): Promise<Response> {
  const chunkSize = options?.chunkSize;
  let progress = 0;
  const reportProgress = (value: number) => {
    // 重试或退回完整下载时进度不倒退；全部读取和校验完成后才报告 100%。
    progress = Math.max(progress, Math.min(value, 0.99));
    options?.progressCallback?.(progress);
  };
  const reportLoaded = (loaded: number, response: Response) => {
    const total = Number(response.headers.get("content-length")) || 0;
    if (total > 0) reportProgress(loaded / total);
  };

  let response: Response;
  if (chunkSize !== undefined) {
    if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0)
      throw new Error("下载分段大小必须是正整数");
    response = await fetchByRange(input, options, chunkSize, reportProgress);
  } else {
    response = await fetchResource(input, options, reportLoaded);
  }
  options?.progressCallback?.(1);
  return response;
}

async function fetchByRange(
  input: RequestInfo,
  options: FetchOptions | undefined,
  chunkSize: number,
  reportProgress: (progress: number) => void,
): Promise<Response> {
  const request = input instanceof Request ? input : undefined;
  const headers = new Headers(options?.init?.headers ?? request?.headers);
  const method = options?.init?.method ?? request?.method ?? "GET";
  if (method.toUpperCase() !== "GET" || headers.has("range"))
    throw new Error("分段下载需要不带 Range 的 GET 请求");

  let offset = 0;
  let bytes: Uint8Array | undefined;
  let responseHeaders: Headers | undefined;
  let etag: string | null = null;
  let lastModified: string | null = null;
  do {
    const end = Math.min(offset + chunkSize, bytes?.byteLength ?? Infinity) - 1;
    headers.set("Range", `bytes=${offset}-${end}`);
    let response: Response | undefined;
    // 只重试当前分段；用户主动取消后直接结束，避免重新发起已取消的下载。
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetchResource(
          input,
          { ...options, init: { ...options?.init, headers } },
          (loaded, partial) => {
            const range = partial.headers.get("content-range");
            const total =
              partial.status === 206
                ? Number(range?.match(/\/(\d+)$/)?.[1])
                : Number(partial.headers.get("content-length"));
            if (total > 0)
              reportProgress(
                ((partial.status === 206 ? offset : 0) + loaded) / total,
              );
          },
        );
        break;
      } catch (error) {
        if (
          (options?.init?.signal ?? request?.signal)?.aborted ||
          attempt === 2
        )
          throw error;
      }
    }
    if (!response) throw new Error("分段下载失败，请重试");
    // 服务器忽略 Range 时，响应体已经是完整文件。
    if (response.status === 200) return response;

    const range = response.headers
      .get("content-range")
      ?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    const encoding = response.headers.get("content-encoding");
    if (!range || (encoding && encoding !== "identity")) {
      // 跨域响应未开放 Content-Range，或返回了压缩表示时，重新完整下载。
      return fetchResource(input, options, (loaded, full) => {
        const total = Number(full.headers.get("content-length"));
        if (total > 0) reportProgress(loaded / total);
      });
    }

    const [, startText, endText, totalText] = range;
    const start = Number(startText);
    const rangeEnd = Number(endText);
    const total = Number(totalText);
    const chunk = new Uint8Array(await response.arrayBuffer());
    if (
      response.status !== 206 ||
      !Number.isSafeInteger(total) ||
      start !== offset ||
      rangeEnd < start ||
      rangeEnd > end ||
      rangeEnd >= total ||
      chunk.byteLength !== rangeEnd - start + 1
    )
      throw new Error("资源分段内容不完整，请重试");

    if (!bytes) {
      bytes = new Uint8Array(total);
      responseHeaders = new Headers(response.headers);
      etag = response.headers.get("etag");
      lastModified = response.headers.get("last-modified");
    } else if (
      // 各段必须使用相同长度和版本标识，避免资源更新时拼接不同版本。
      total !== bytes.byteLength ||
      response.headers.get("etag") !== etag ||
      response.headers.get("last-modified") !== lastModified
    ) {
      throw new Error("下载期间资源已更新，请重试");
    }
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  } while (offset < bytes.byteLength);

  // 合并后的响应代表完整文件，移除分段相关头以供普通 Response 调用方使用。
  responseHeaders!.delete("content-range");
  responseHeaders!.delete("content-encoding");
  responseHeaders!.set("content-length", String(bytes.byteLength));
  return new Response(bytes, {
    status: 200,
    statusText: "OK",
    headers: responseHeaders,
  });
}

/** 超时覆盖当前请求的响应头及响应体读取。 */
async function fetchResource(
  input: RequestInfo,
  options: FetchOptions | undefined,
  reportLoaded: (loaded: number, response: Response) => void,
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal =
    options?.init?.signal ??
    (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  if (externalSignal?.aborted) abort();
  const timeout = setTimeout(abort, options?.timeoutMs ?? 30_000);
  try {
    const response = await fetch(input, {
      ...options?.init,
      signal: controller.signal,
    });
    if (!response.ok) throw new ResourceHttpError(response.status);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("资源内容为空，请重试");
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      reportLoaded(loaded, response);
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(bytes, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("资源加载超时或已取消，请检查网络后重试");
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abort);
  }
}
