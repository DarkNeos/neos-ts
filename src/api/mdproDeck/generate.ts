import { MdproResp } from "./schema";
import { mdproRequest } from "./util";

const API_PATH = "api/mdpro3/deck/deckId";

export async function generateDeck(): Promise<MdproResp<string>> {
  return mdproRequest(API_PATH);
}
