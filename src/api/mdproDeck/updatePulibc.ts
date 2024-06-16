import { useConfig } from "@/config";

import { MdproResp } from "./schema";
import { handleHttps, mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "/api/mdpro3/deck/public";

export interface UpdatePublicReq {
  userId: number;
  deckId: string;
  isPublic: boolean;
}

export async function updatePublic(
  req: UpdatePublicReq,
  token: string,
): Promise<MdproResp<void> | undefined> {
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
