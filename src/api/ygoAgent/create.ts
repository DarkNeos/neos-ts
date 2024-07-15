import { useConfig } from "@/config";

import { handleHttps } from "..";
import { agentHeader } from "./util";

const { agentServer } = useConfig();
const API_PATH = "v0/duels";

interface CreateResp {
  duelId: string;
  index: number;
}

export async function createDuel(): Promise<CreateResp | undefined> {
  const headers = agentHeader();

  const resp = await fetch(`${agentServer}/${API_PATH}`, {
    method: "POST",
    headers,
    redirect: "follow",
  });

  return await handleHttps(resp, API_PATH);
}
