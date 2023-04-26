import { fetchCard, ygopro } from "@/api";
import { setSortCardModalIsOpen } from "@/reducers/duel/mod";
import { fetchSortCardMeta } from "@/reducers/duel/modal/sortCardModalSlice";
import { AppDispatch } from "@/store";
import MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

import { messageStore } from "@/valtioStores";

export default async (sortCard: MsgSortCard, dispatch: AppDispatch) => {
  // for (const option of sortCard.options) {
  //   dispatch(fetchSortCardMeta(option.toObject()));
  // }
  // dispatch(setSortCardModalIsOpen(true));

  await Promise.all(
    sortCard.options.map(async ({ code, response }) => {
      const meta = await fetchCard(code!, true);
      messageStore.sortCardModal.options.push({
        meta,
        response: response!,
      });
    })
  );
  messageStore.sortCardModal.isOpen = true;
};
