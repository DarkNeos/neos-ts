import { subscribe } from "valtio";

import { pullDecks } from "@/api/mdproDeck";

import { OnlineDecks } from "./onlineDecks";
import { personalCloudDeckStore } from "./personalCloudDeckStore";

// 公开查询适配 MDPro 参数；个人记录和确认删除交给共享的个人云卡组模块。
export const mdproDeckStore = new OnlineDecks({
  publicList: (query, page, size) =>
    pullDecks({
      page,
      size,
      keyWord: query || undefined,
      sortLike: true,
    }),
  personalList: async (account) => {
    try {
      await personalCloudDeckStore.refresh(account);
      return { code: 0, message: "", data: personalCloudDeckStore.state.decks };
    } catch (error) {
      return {
        code: -1,
        message:
          error instanceof Error ? error.message : "加载卡组失败，请重试",
      };
    }
  },
  delete: (account, deckId) =>
    personalCloudDeckStore.delete(deckId, account.id),
  isDeleted: (id, accountId) => personalCloudDeckStore.isDeleted(id, accountId),
});

subscribe(personalCloudDeckStore.state, () => {
  mdproDeckStore.reconcileRecords(
    personalCloudDeckStore.state.accountId,
    personalCloudDeckStore.state.decks,
  );
});
