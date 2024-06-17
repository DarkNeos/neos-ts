import { useConfig } from "@/config";

import { MdproDeck, MdproResp } from "./schema";
import { handleHttps, mdproHeaders } from "./util";
const { mdproServer } = useConfig();

const API_PATH = "/api/mdpro3/sync/";

export interface PersonalListReq {
  /* ID of MyCard Account */
  userID: number;
  /* Token of MyCard Account */
  token: string;
}

export async function getPersonalList(
  req: PersonalListReq,
): Promise<MdproResp<MdproDeck[]> | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("token", req.token);

  const resp = await fetch(`${mdproServer}/${API_PATH}/${req.userID}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
