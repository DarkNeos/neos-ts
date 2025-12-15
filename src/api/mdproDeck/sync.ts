import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproResp } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "api/mdpro3/sync/single";

export interface SyncReq {
  userId: number;
  deckContributor: string;
  deck: {
    deckId: string;
    deckName: string;
    deckType?: string; // NEW: Deck type/category (optional, can use empty string)
    deckCoverCard1?: number; // NEW: Cover card 1
    deckCoverCard2?: number; // NEW: Cover card 2
    deckCoverCard3?: number; // NEW: Cover card 3
    deckCase: number;
    deckProtector?: number; // NEW: Card protector/sleeve
    deckYdk: string;
    isDelete?: boolean; // NEW: Whether this is a delete operation
    timestamp?: number; // NEW: Update timestamp (10 or 13 digit)
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
