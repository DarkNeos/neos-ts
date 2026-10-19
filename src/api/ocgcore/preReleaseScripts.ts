import type { ScriptReaderFn } from "koishipro-core.js";

import { cachedBinary } from "../../infra/resourceCache";
import { readResourceVersion } from "../../infra/resourceVersion";

/** 内核只能同步读取脚本；收集缺失文件，下载后由调用方重新演算。 */
export function createPreReleaseScriptReader(
  base: ScriptReaderFn,
  cardIds: ReadonlySet<number>,
  baseUrl: string | undefined,
  progress: (text: string) => void,
  versionUrl?: string,
) {
  const loaded = new Map<string, Uint8Array | null>();
  const pending = new Set<string>();
  let active = false;
  let versionChecked = false;
  let version: string | undefined;
  const isPreRelease = (filename: string) => {
    const match = filename.match(/^c(\d+)\.lua$/);
    return !!match && cardIds.has(Number(match[1]));
  };
  const read: ScriptReaderFn = (path) => {
    const fallback = base(path);
    if (!baseUrl) return fallback;
    const filename = path
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^script\//, "");
    if (
      !/^(?:[\w-]+\/)*[\w.-]+\.lua$/.test(filename) ||
      filename.startsWith("single/")
    )
      return fallback;
    if (loaded.has(filename)) return loaded.get(filename) ?? fallback;
    const preRelease = isPreRelease(filename);
    // 正式录像只使用原脚本；超先行卡出现后才为缺失依赖查询远端。
    if (
      !preRelease &&
      ((fallback !== null && fallback !== undefined) || !active)
    )
      return fallback;
    active = true;
    pending.add(filename);
    return fallback;
  };
  return {
    read,
    assertReady() {
      if (pending.size) throw new Error("超先行脚本尚未加载完成");
    },
    async loadMissing(): Promise<boolean> {
      if (!pending.size || !baseUrl) return false;
      // 每次录像演算只检查一次，后续发现的依赖沿用同一版本号。
      if (!versionChecked) {
        versionChecked = true;
        if (versionUrl) {
          progress("正在检查超先行脚本版本");
          version = await readResourceVersion(versionUrl);
        }
      }
      const filenames = [...pending];
      pending.clear();
      await Promise.all(
        filenames.map(async (filename) => {
          progress(`正在加载超先行脚本：${filename}`);
          try {
            const bytes = await cachedBinary(
              `${baseUrl.replace(/\/+$/, "")}/${filename}`,
              {
                version,
                allowNotFound: !isPreRelease(filename),
                validate: (bytes) => {
                  const start = new TextDecoder()
                    .decode(
                      new Uint8Array(bytes, 0, Math.min(256, bytes.byteLength)),
                    )
                    .trimStart();
                  if (
                    !bytes.byteLength ||
                    bytes.byteLength > 1024 * 1024 ||
                    /^(?:<!doctype|<html|<\?xml|<error)/i.test(start)
                  )
                    throw new Error("Lua 脚本内容无效");
                },
              },
            );
            loaded.set(filename, bytes ? new Uint8Array(bytes) : null);
          } catch (error) {
            throw new Error(
              `超先行脚本 ${filename} 加载失败：${
                error instanceof Error ? error.message : "请检查网络后重试"
              }`,
            );
          }
        }),
      );
      return true;
    },
  };
}
