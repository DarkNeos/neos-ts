import { ygopro } from "@/api";
import { playerStore } from "@/stores";

// FIXME: player0 不一定是当前玩家
export default function handleDeckCount(pb: ygopro.YgoStocMsg) {
  const deckCount = pb.stoc_deck_count;

  playerStore.player0.deckInfo = {
    mainCnt: deckCount.meMain,
    extraCnt: deckCount.meExtra,
    sideCnt: deckCount.meSide,
  };

  playerStore.player1.deckInfo = {
    mainCnt: deckCount.opMain,
    extraCnt: deckCount.opExtra,
    sideCnt: deckCount.opSide,
  };
}
