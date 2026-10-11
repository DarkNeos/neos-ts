import { sendSelectMultiResponse, sendSelectSingleResponse } from "@/api";
import type { Container } from "@/container";

import {
  CardSelectionProcess,
  type SelectionCompletion,
} from "./cardSelectionProcess";
import type { CardSelectionOption } from "./cardSelectionTypes";
import { registerDuelDialogReset } from "./duelDialogs";

// 场上点选和选卡弹窗共用一次请求，保证勾选、校验和完成状态一致。
export const duelSelection = new CardSelectionProcess<CardSelectionOption>();
registerDuelDialogReset(() => duelSelection.reset());

export function respondToCardSelection(
  container: Container,
  result: SelectionCompletion<CardSelectionOption>,
) {
  container.context.matStore.hint.esHint = undefined;
  container.context.matStore.hint.esSelectHint = undefined;
  // reset 没有协议响应；断线后的完成回调也只清理提示，不再发送数据。
  if (!result.response || container.conn.cancelled || container.conn.isClosed())
    return;
  if (result.response.kind === "single")
    sendSelectSingleResponse(container.conn, result.response.value);
  else sendSelectMultiResponse(container.conn, result.response.values);
}
