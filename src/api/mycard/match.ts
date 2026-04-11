const API_URL = "https://sapi.moecube.com:444/ygopro/match";

export interface MatchInfo {
  address: string;
  port: number;
  password: string;
}

/**
 * 请求匹配
 *
 * @param username 用户名
 * @param secret 认证密钥（优先使用 u16Secret，如果没有则使用 external_id）
 * @param arena 匹配类型（athletic: 竞技, entertain: 娱乐）
 * @returns 匹配信息（服务器地址、端口、密码）
 */
export async function match(
  username: string,
  secret: number,
  arena: "athletic" | "entertain" = "entertain",
): Promise<MatchInfo | undefined> {
  const headers = {
    Authorization: "Basic " + customBase64Encode(username + ":" + secret),
  };
  let response: Response | undefined = undefined;
  const params = new URLSearchParams({
    arena,
    // TODO: locale?
  });

  try {
    const resp = await fetch(API_URL + "?" + params.toString(), {
      method: "POST",
      headers: headers,
    });

    if (resp.ok) {
      response = resp;
    } else {
      console.error(`match error: ${resp.status}`);
    }
  } catch (error) {
    console.error(`match error: ${error}`);
  }

  return (await response?.json()) as MatchInfo;
}

function customBase64Encode(input: string): string {
  const uint8Array = new TextEncoder().encode(input);
  const base64String = btoa(String.fromCharCode(...uint8Array));
  return base64String;
}
