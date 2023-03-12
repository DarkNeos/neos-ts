import axios from "axios";
import NeosConfig from "../../neos.config.json";

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

export function fetchStrings(region: string, id: number): string {
  return localStorage.getItem(`${region}_${id}`) || "";
}
