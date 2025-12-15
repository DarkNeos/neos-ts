import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproResp } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "api/mdpro3/sync/single";

interface DeleteReq {
  userId: number;
  deckContributor: string;
  deck: {
    deckId: string;
    deckName: string;
    deckType: string;
    deckCoverCard1: number;
    deckCoverCard2: number;
    deckCoverCard3: number;
    deckCase: number;
    deckProtector: number;
    deckYdk: string;
    isDelete: boolean;
    timestamp: number;
  };
}

export async function deleteDeck(
  userID: number,
  token: string,
  deckID: string,
  deckContributor: string = "", // Added parameter with default
): Promise<MdproResp<boolean> | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);

  const req: DeleteReq = {
    userId: userID,
    deckContributor: deckContributor,
    deck: {
      deckId: deckID,
      deckName: "", // Required but not used for delete
      deckType: "", // Required field
      deckCoverCard1: 0, // Required field
      deckCoverCard2: 0, // Required field
      deckCoverCard3: 0, // Required field
      deckCase: 0, // Required field
      deckProtector: 0, // Required field
      deckYdk: "", // Required but not used for delete
      isDelete: true,
      timestamp: Date.now(),
    },
  };

  const resp = await fetch(`${mdproServer}/${API_PATH}`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(req),
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
