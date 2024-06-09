import { useConfig } from "@/config";

import { MdproDeck } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "api/mdpro3/deck/list";

export interface PullReq {
  page?: number;
  size?: number;
  keyWord?: string;
  sortLike?: boolean;
  sortRank?: boolean;
  contributor?: string;
}

const defaultPullReq: PullReq = {
  page: 1,
  size: 20,
};

interface PullResp {
  code: number;
  message: string;
  data?: {
    current: number;
    size: number;
    total: number;
    pages: number;
    records: MdproDeck[];
  };
}

export async function pullDecks(
  req: PullReq = defaultPullReq,
): Promise<PullResp | undefined> {
  const myHeaders = mdproHeaders();

  const params = new URLSearchParams();
  Object.entries(req).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });

  const url = new URL(`${mdproServer}/${API_PATH}`);
  url.search = params.toString();

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  });

  if (!resp.ok) {
    console.error(`[Pull of Mdpro Decks] HTTPS error! status: ${resp.status}`);
    return undefined;
  } else {
    return await resp.json();
  }
}
