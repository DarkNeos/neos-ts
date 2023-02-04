import axios from "axios";

export async function initStrings() {
  const strings = (
    await axios.get<string>(`ygopro-database/locales/zh-CN/strings.conf`)
  ).data;
  localStorage.setItem("ygo-strings", strings);
}

export async function fetchStrings(
  region: string,
  id: number
): Promise<string> {
  return (
    await axios.get<string>(`http://localhost:3030/strings/${region}_${id}`)
  ).data;
}
