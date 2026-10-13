import { MdproDeck, MdproResp } from "./schema";
import { mdproRequest } from "./util";

const API_PATH = "api/mdpro3/deck";

export async function mgetDeck(
  id: string,
  token?: string,
): Promise<MdproResp<MdproDeck>> {
  return mdproRequest(`${API_PATH}/${id}`, { token });
}
