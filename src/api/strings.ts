import { useConfig } from "@/config";

import { fetchCard, getCardStr } from "./cards";

const { stringsUrl } = useConfig();
export const DESCRIPTION_LIMIT = 10000;

export async function initStrings() {
  const strings = await (await fetch(stringsUrl)).text();

  console.log({ strings });

  const lineIter = strings.split("\n");
  for (const line of lineIter) {
    if (!line.startsWith("#") && line !== "") {
      let [region, code, value] = line.split(" ", 3);
      localStorage.setItem(`${region}_${code}`, value);
    }
  }
}

export enum Region {
  System = "!system",
  Victory = "!victory",
  Counter = "!counter",
}

export function fetchStrings(region: Region, id: string | number): string {
  return localStorage.getItem(`${region}_${id}`) || "";
}

export async function getStrings(description: number): Promise<string> {
  if (description < DESCRIPTION_LIMIT) {
    return fetchStrings(Region.System, description);
  } else {
    const code = description >> 4;
    const index = description & 0xf;

    return getCardStr(await fetchCard(code), index) || "";
  }
}
