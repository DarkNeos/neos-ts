import { ygopro } from "@/api";
import { Container } from "@/container";

// TODO: 这里设置的player可能顺序会反
export default function handleDeckCount(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const context = container.context;
  const deckCount = pb.stoc_deck_count;

  const me = context.roomStore.getMePlayer();
  const op = context.roomStore.getOpPlayer();

  if (me) {
    me.deckInfo = {
      mainSize: deckCount.meMain,
      extraSize: deckCount.meExtra,
      sideSize: deckCount.meSide,
    };
  }

  if (op) {
    op.deckInfo = {
      mainSize: deckCount.opMain,
      extraSize: deckCount.opExtra,
      sideSize: deckCount.opSide,
    };
  }
}
