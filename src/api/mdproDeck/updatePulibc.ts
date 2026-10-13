import { MdproResp } from "./schema";
import { mdproRequest } from "./util";

const API_PATH = "api/mdpro3/deck/public";

export interface UpdatePublicReq {
  userId: number;
  deckId: string;
  isPublic: boolean;
}

export async function updatePublic(
  req: UpdatePublicReq,
  token: string,
): Promise<MdproResp<void>> {
  // 此接口用 message 的字符串 true/false 表示是否更新成功。
  return mdproRequest(API_PATH, { token, body: req });
}
