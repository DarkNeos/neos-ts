import { useConfig } from "@/config";

import { handleHttps } from "..";
import { agentHeader } from "./util";
const { agentServer } = useConfig();
const API_PATH = "/v0/duels";

export async function deleteDuel(duelId: string): Promise<void | undefined> {
  const headers = agentHeader();

  const apiPath = `${agentServer}/${API_PATH}/${duelId}`;

  const resp = await fetch(apiPath, {
    method: "DELETE",
    headers,
    redirect: "follow",
  });

  return await handleHttps(resp, apiPath);
}
