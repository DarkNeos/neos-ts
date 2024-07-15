import { useConfig } from "@/config";
import { pfetch } from "@/infra";

import { handleHttps } from "..";
import { MdproDeck, MdproResp } from "./schema";
import { mdproHeaders } from "./util";
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
  progressCallback?: (progress: number) => void,
): Promise<MdproResp<MdproDeck[]> | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("token", req.token);

  const resp = await pfetch(`${mdproServer}/${API_PATH}/${req.userID}`, {
    init: {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    },
    progressCallback,
  });

  return await handleHttps(resp, API_PATH);
}
