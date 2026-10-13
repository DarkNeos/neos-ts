import { useConfig } from "@/config";

import type { MdproResp } from "./schema";

const { mdproServer } = useConfig();

/** 各接口保留自己的业务结果格式，HTTP、网络和响应解析错误统一返回失败。 */
export async function mdproRequest<T>(
  path: string,
  options: { token?: string; body?: object } = {},
): Promise<MdproResp<T>> {
  const headers = new Headers({ ReqSource: "MDPro3", ClientSource: "Web" });
  if (options.token) headers.set("token", options.token);
  if (options.body) headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${mdproServer}/${path}`, {
      method: options.body ? "POST" : "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      redirect: "follow",
    });
    const result: MdproResp<T> | undefined = await response
      .json()
      .catch((error) => {
        if (controller.signal.aborted) throw error;
        return undefined;
      });
    if (!response.ok)
      return {
        code: response.status,
        message:
          typeof result?.message === "string" && result.message.trim()
            ? result.message
            : `云卡组请求失败（HTTP ${response.status}）`,
      };
    if (!result || typeof result.code !== "number")
      return { code: -1, message: "云卡组接口返回了无效数据，请稍后重试" };
    return result;
  } catch {
    return {
      code: -1,
      message: controller.signal.aborted
        ? "云卡组请求超时，请稍后重试"
        : "云卡组请求未完成，请检查网络后重试",
    };
  } finally {
    clearTimeout(timeout);
  }
}
