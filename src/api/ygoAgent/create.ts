import { handleHttps } from "..";
import { agentHeader, getAgentServer } from "./util";

const API_PATH = "v0/duels";

interface CreateResp {
  duelId: string;
  index: number;
}

export async function createDuel(): Promise<CreateResp | undefined> {
  const headers = agentHeader();

  const resp = await fetch(`${getAgentServer()}/${API_PATH}`, {
    method: "POST",
    headers,
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
