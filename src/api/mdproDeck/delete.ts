import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproResp } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "/api/mdpro3/sync/single";

interface DeleteReq {
  userId: number;
  deck: {
    deckId: string;
    isDelete: boolean;
  };
}

export async function deleteDeck(
  userID: number,
  token: string,
  deckID: string,
): Promise<MdproResp<boolean> | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("token", token);

  const req: DeleteReq = {
    userId: userID,
    deck: {
      deckId: deckID,
      isDelete: true,
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
