/**
 * 获取用户的 u16Secret
 *
 * u16Secret 是用于匹配和房间认证的时间轮换密钥
 * 每次使用前都需要重新获取，因为它会按时间轮换
 */

const API_URL = "https://sapi.moecube.com:444/accounts/authUser";

interface U16SecretResponse {
  u16Secret: number;
}

export async function getUserU16Secret(token: string): Promise<number> {
  if (!token) {
    throw new Error("获取用户密钥失败：token 不存在，请重新登录");
  }

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: U16SecretResponse = await response.json();

    if (data.u16Secret === null || data.u16Secret === undefined) {
      throw new Error("服务器返回的数据中没有 u16Secret");
    }

    return data.u16Secret;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "未知错误";
    console.error("获取 u16Secret 失败:", errorMsg);
    throw new Error(`获取用户密钥失败：${errorMsg}，请尝试重新登录`);
  }
}
