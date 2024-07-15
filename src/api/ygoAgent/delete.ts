import { handleHttps } from "..";
import { agentHeader, getAgentServer } from "./util";
const API_PATH = "/v0/duels";

export async function deleteDuel(duelId: string): Promise<void | undefined> {
  const headers = agentHeader();

  const apiPath = `${getAgentServer()}/${API_PATH}/${duelId}`;

  const resp = await fetch(apiPath, {
    method: "DELETE",
    headers,
    redirect: "follow",
  });

  return await handleHttps(resp, apiPath);
}
