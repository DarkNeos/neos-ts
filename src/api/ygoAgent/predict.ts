import { useConfig } from "@/config";

import { handleHttps } from "..";
import { Input, MsgResponse } from "./schema";
import { agentHeader } from "./util";

const { agentServer } = useConfig();
const apiPath = (duelId: string) => `v0/duels/${duelId}/predict`;

export interface PredictReq {
  /**
   * The index must be equal to the index from the previous response of the same duelId.
   */
  index: number;
  input: Input;
  prev_action_idx: number;
}

interface PredictResp {
  /**
   * It will be equal to the request's index + 1.
   */
  index: number;
  predict_results: MsgResponse;
}

export async function predictDuel(
  duelId: string,
  req: PredictReq,
): Promise<PredictResp | undefined> {
  const headers = {
    ...agentHeader(),
    "Content-Type": "application/json",
  };

  const resp = await fetch(`${agentServer}/${apiPath(duelId)}`, {
    method: "POST",
    headers,
    body: JSON.stringify(req),
    redirect: "follow",
  });

  return await handleHttps(resp, apiPath(duelId));
}
