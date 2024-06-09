import { useConfig } from "@/config";

import { MdproDeck } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "api/mdpro3/deck/update";

interface UpdateResp {
  code: number;
  message: string;
  data: MdproDeck;
}

export async function updateDeck(
  req: MdproDeck,
): Promise<UpdateResp | undefined> {
  const myHeaders = mdproHeaders();

  const resp = await fetch(`${mdproServer}/${API_PATH}`, {
    method: "PUT",
    headers: myHeaders,
    body: JSON.stringify(req),
    redirect: "follow",
  });

  if (!resp.ok) {
    console.error(`[Update of MdproDeck] HTTPS error! status: ${resp.status}`);
    return undefined;
  } else {
    return await resp.json();
  }
}
