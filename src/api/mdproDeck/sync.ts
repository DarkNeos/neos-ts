import { useConfig } from "@/config";

import { MdproResp } from "./schema";
import { handleHttps, mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "/api/mdpro3/sync/single";

export interface SyncReq {
  userId: number;
  deckContributor: string;
  deck: {
    deckId: string;
    deckName: string;
    deckCase: number;
    deckYdk: string;
  };
}

export async function syncDeck(
  req: SyncReq,
  token: string,
): Promise<MdproResp<boolean> | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);

  const resp = await fetch(`${mdproServer}/${API_PATH}`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(req),
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
