import { useConfig } from "@/config";

import { handleHttps } from "..";
import { MdproDeckLike, MdproResp } from "./schema";
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

interface RespData {
  current: number;
  size: number;
  total: number;
  pages: number;
  records: MdproDeckLike[];
}

export async function pullDecks(
  req: PullReq = defaultPullReq,
): Promise<MdproResp<RespData> | undefined> {
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

  return await handleHttps(resp, API_PATH);
}
