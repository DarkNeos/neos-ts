import { pfetch } from "./pfetch";

/** 版本检查失败时沿用资源原有的缓存策略。 */
export async function readResourceVersion(
  url: string,
): Promise<string | undefined> {
  try {
    const response = await pfetch(url, {
      init: { cache: "no-cache" },
      timeoutMs: 5_000,
    });
    const bytes = await response.arrayBuffer();
    const value = new TextDecoder().decode(bytes).trim();
    if (bytes.byteLength > 64 || !/^\d{1,20}$/.test(value)) return;
    return value;
  } catch {
    // 下一次页面加载或录像演算会再次检查。
  }
}
