import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { player0DeckInfo, player1DeckInfo } from "@/reducers/playerSlice";
import { store } from "@/store";
import { playerStore } from "@/valtioStores";

// FIXME: player0 不一定是当前玩家
export default function handleDeckCount(pb: ygopro.YgoStocMsg) {
  const dispath = store.dispatch;
  const deckCount = pb.stoc_deck_count;

  dispath(
    player0DeckInfo({
      mainCnt: deckCount.meMain,
      extraCnt: deckCount.meExtra,
      sideCnt: deckCount.meSide,
    })
  );

  playerStore.player0.deckInfo = {
    mainCnt: deckCount.meMain,
    extraCnt: deckCount.meExtra,
    sideCnt: deckCount.meSide,
  };

  dispath(
    player1DeckInfo({
      mainCnt: deckCount.opMain,
      extraCnt: deckCount.opExtra,
      sideCnt: deckCount.opSide,
    })
  );

  playerStore.player1.deckInfo = {
    mainCnt: deckCount.opMain,
    extraCnt: deckCount.opExtra,
    sideCnt: deckCount.opSide,
  };
}
