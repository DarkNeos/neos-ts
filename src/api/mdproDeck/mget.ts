import { useConfig } from "@/config";

import { MdproDeck } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();

const API_PATH = "/api/mdpro3/deck";

interface MgetResp {
  code: number;
  message: string;
  data?: MdproDeck;
}

export async function mgetDeck(id: string): Promise<MgetResp | undefined> {
  const myHeaders = mdproHeaders();

  const resp = await fetch(`${mdproServer}/${API_PATH}/${id}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });

  if (!resp.ok) {
    console.error(`[Mget of Mdpro Decks] HTTPS error! status: ${resp.status}`);
    return undefined;
  } else {
    return await resp.json();
  }
}
