import { ygopro } from "@/api";
import { roomStore } from "@/stores";

// TODO: 这里设置的player可能顺序会反
export default function handleDeckCount(pb: ygopro.YgoStocMsg) {
  const deckCount = pb.stoc_deck_count;

  const me = roomStore.getMePlayer();
  const op = roomStore.getOpPlayer();

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
