import { MdproResp } from "./schema";
import { mdproRequest } from "./util";

// 与 MDPro3 一致，批量同步提交删除标记，返回处理数量。
const API_PATH = "api/mdpro3/sync/multi";

interface DeleteReq {
  userId: number;
  deckContributor: string;
  decks: {
    deckId: string;
    isDelete: boolean;
  }[];
}

/** 提交一条删除标记；调用方需同时检查业务状态和处理数量，才能移除本地卡组。 */
export async function deleteDeck(
  userID: number,
  token: string,
  deckID: string,
  deckContributor: string = "",
): Promise<MdproResp<number>> {
  const req: DeleteReq = {
    userId: userID,
    deckContributor,
    decks: [{ deckId: deckID, isDelete: true }],
  };

  return mdproRequest(API_PATH, { token, body: req });
}
