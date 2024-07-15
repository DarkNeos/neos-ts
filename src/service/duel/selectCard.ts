import { sendSelectMultiResponse, ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

import { Container } from "@/container";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";

export default async (container: Container, selectCard: MsgSelectCard) => {
  const { cancelable, min, max, cards } = selectCard;
  const conn = container.conn;

  // TODO: handle release_param

  if (!cancelable && cards.length === 1) {
    // auto send
    sendSelectMultiResponse(conn, [cards[0].response]);
    return;
  }

  const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
    cards,
  );
  await displaySelectActionsModal({
    cancelable,
    min,
    max,
    selecteds,
    mustSelects,
    selectables,
  });
};
