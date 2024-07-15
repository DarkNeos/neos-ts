import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproDeck, MdproResp } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();

const API_PATH = "/api/mdpro3/deck";

export async function mgetDeck(
  id: string,
): Promise<MdproResp<MdproDeck> | undefined> {
  const myHeaders = mdproHeaders();

  const resp = await fetch(`${mdproServer}/${API_PATH}/${id}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
