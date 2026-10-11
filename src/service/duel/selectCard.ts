import { sendSelectMultiResponse, ygopro } from "@/api";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

import { Container } from "@/container";

import { fetchCheckCardMeta } from "../utils";
import { selectCards } from "./cardSelection";

export default async (container: Container, selectCard: MsgSelectCard) => {
  const { cancelable, min, max, cards } = selectCard;
  const conn = container.conn;
  const context = container.context;

  if (conn.cancelled || conn.isClosed()) return;
  const first = cards[0];
  // 卡组内的同名卡无需逐张区分；数量固定时可以直接响应，减少重复弹窗。
  // 自动响应仅用于不可取消的请求，保留需要玩家切换候选区域的取消入口。
  const equivalentDeckCards =
    min === max &&
    !!first?.code &&
    cards.every(
      (card) =>
        card.code === first.code &&
        card.location.zone === ygopro.CardZone.DECK &&
        card.location.controller === first.location.controller &&
        !card.location.is_overlay,
    );
  // 可取消的场上优先选择需要保留取消入口，取消后才会提供墓地等区域的候选。
  if (!cancelable && (cards.length <= min || equivalentDeckCards)) {
    sendSelectMultiResponse(
      conn,
      cards.slice(0, min).map((card) => card.response),
    );
    return;
  }

  const { mustSelects, selectables } = await fetchCheckCardMeta(context, cards);
  if (container.conn.cancelled) return;
  await selectCards(container, {
    selectionKind: "count",
    totalLevels: 0,
    overflow: false,
    single: false,
    cancelable,
    min,
    max,
    mustSelects,
    selectables,
  });
};
