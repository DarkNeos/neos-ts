import axios from "axios";

export async function fetchStrings(
  region: string,
  id: number
): Promise<string> {
  return (
    await axios.get<string>(`http://localhost:3030/strings/${region}_${id}`)
  ).data;
}
