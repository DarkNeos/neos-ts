import { MdproDeckLike, MdproResp } from "./schema";
import { mdproRequest } from "./util";

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
): Promise<MdproResp<RespData>> {
  const params = new URLSearchParams();
  Object.entries(req).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });

  return mdproRequest(`${API_PATH}?${params.toString()}`);
}
