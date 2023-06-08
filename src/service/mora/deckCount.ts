import { ygopro } from "@/api";
import { matStore } from "@/stores";

// FIXME: player0 不一定是当前玩家
export default function handleDeckCount(pb: ygopro.YgoStocMsg) {
  const deckCount = pb.stoc_deck_count;

  matStore.player[0].deckInfo = {
    mainCnt: deckCount.meMain,
    extraCnt: deckCount.meExtra,
    sideCnt: deckCount.meSide,
  };

  matStore.player[1].deckInfo = {
    mainCnt: deckCount.opMain,
    extraCnt: deckCount.opExtra,
    sideCnt: deckCount.opSide,
  };
}
