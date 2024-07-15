import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproResp } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();

const API_PATH = "/api/mdpro3/deck/deckId";

export async function generateDeck(): Promise<MdproResp<string> | undefined> {
  const myHeaders = mdproHeaders();

  const resp = await fetch(`${mdproServer}/${API_PATH}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
