export function mdproHeaders(): Headers {
  const myHeaders = new Headers();
  myHeaders.append("ReqSource", "MDPro3");
  myHeaders.append("ClientSource", "Web");

  return myHeaders;
}

export async function handleHttps<T>(
  resp: Response,
  api: string,
): Promise<T | undefined> {
  if (!resp.ok) {
    console.error(
      `[Mdpro] Https error from api ${api}! status: ${resp.status}`,
    );
    return undefined;
  } else {
    return await resp.json();
  }
}
