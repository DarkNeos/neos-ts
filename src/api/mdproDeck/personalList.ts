import { MdproDeck, MdproResp } from "./schema";
import { mdproRequest } from "./util";

const API_PATH = "api/mdpro3/sync";

export interface PersonalListReq {
  /* ID of MyCard Account */
  userID: number;
  /* Token of MyCard Account */
  token: string;
}

export async function getPersonalList(
  req: PersonalListReq,
): Promise<MdproResp<MdproDeck[]>> {
  return mdproRequest(`${API_PATH}/${req.userID}/nodel`, {
    token: req.token,
  });
}
