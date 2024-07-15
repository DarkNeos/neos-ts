export * from "./cards";
export * from "./cookies";
export * from "./forbiddens";
export * from "./mdproDeck";
export * from "./mycard";
export * from "./ocgcore/idl/ocgcore";
export * from "./ocgcore/ocgHelper";
export * from "./strings";
export * from "./superPreRelease";
export * from "./ygoAgent";

export async function handleHttps<T>(
  resp: Response,
  api: string,
): Promise<T | undefined> {
  if (!resp.ok) {
    console.error(`Https error from api ${api}! status: ${resp.status}`);
    return undefined;
  } else {
    return await resp.json();
  }
}
