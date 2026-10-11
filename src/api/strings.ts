import { useConfig } from "@/config";
import { pfetch } from "@/infra/pfetch";

import { fetchCard, getCardStr } from "./cards";

let { stringsUrl } = useConfig();
export const DESCRIPTION_LIMIT = 10000;

export async function initStrings() {
  const language = localStorage.getItem("language") || "cn";

  //It currently only supports en-US, es-ES, ja-JP, ko-KR, zh-CN
  switch (language) {
    case "en":
    case "br":
    case "pt":
    case "fr":
      stringsUrl = stringsUrl.replace("zh-CN", "en-US");
      break;
    case "ja":
      stringsUrl = stringsUrl.replace("zh-CN", "ja-JP");
      break;
    case "es":
      stringsUrl = stringsUrl.replace("zh-CN", "es-ES");
      break;
    case "ko":
      stringsUrl = stringsUrl.replace("zh-CN", "ko-KR");
      break;
    default:
      break;
  }

  const strings = await (await pfetch(stringsUrl)).text();

  const lineIter = strings.split("\n");
  for (const line of lineIter) {
    if (!line.startsWith("#") && line !== "") {
      let [region, code, value] = line.split(" ", 3);
      try {
        localStorage.setItem(`${region}_${code}`, value);
      } catch (error) {
        throw new Error("无法保存卡片文案，请检查浏览器存储空间后重试");
      }
    }
  }
}

export enum Region {
  System = "!system",
  Victory = "!victory",
  Counter = "!counter",
}

export function fetchStrings(region: Region, id: string | number): string {
  return localStorage.getItem(`${region}_${id}`) ?? "?";
}

export function getStrings(description: number): string {
  if (description < DESCRIPTION_LIMIT) {
    return fetchStrings(Region.System, description);
  } else {
    const code = description >> 4;
    const index = description & 0xf;

    return getCardStr(fetchCard(code), index) ?? "[?]";
  }
}
