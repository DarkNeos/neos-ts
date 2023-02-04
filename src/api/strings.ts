import axios from "axios";

export async function initStrings() {
  const strings = (
    await axios.get<string>(`ygopro-database/locales/zh-CN/strings.conf`)
  ).data;

  const lineIter = strings.split("\n");
  for (const line of lineIter) {
    if (!line.startsWith("#") && line !== "") {
      let [region, code, value] = line.split(" ", 3);
      localStorage.setItem(`${region}_${code}`, value);
    }
  }
}

export async function fetchStrings(
  region: string,
  id: number,
  local?: boolean
): Promise<string> {
  if (local) {
    return localStorage.getItem(`${region}_${id}`) || "";
  }

  return (
    await axios.get<string>(`http://localhost:3030/strings/${region}_${id}`)
  ).data;
}
