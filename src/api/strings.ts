import axios from "axios";
import NeosConfig from "../../neos.config.json";
import { getCardStr, fetchCard } from "./cards";

const DESCRIPTION_LIMIT = 10000;

export async function initStrings() {
  const strings = (await axios.get<string>(NeosConfig.stringsUrl)).data;

  const lineIter = strings.split("\n");
  for (const line of lineIter) {
    if (!line.startsWith("#") && line !== "") {
      let [region, code, value] = line.split(" ", 3);
      localStorage.setItem(`${region}_${code}`, value);
    }
  }
}

export function fetchStrings(region: string, id: string | number): string {
  return localStorage.getItem(`${region}_${id}`) || "";
}

export async function getStrings(description: number): Promise<string> {
  if (description < DESCRIPTION_LIMIT) {
    return fetchStrings("!system", description);
  } else {
    const code = description >> 4;
    const index = description & 0xf;

    return getCardStr(await fetchCard(code, true), index) || "";
  }
}
