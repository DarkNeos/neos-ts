import { ygopro } from "@/api";
import { player0Enter, player1Enter } from "@/reducers/playerSlice";
import { store } from "@/store";
import { playerStore } from "@/valtioStores";

export default function handleHsPlayerEnter(pb: ygopro.YgoStocMsg) {
  // const dispatch = store.dispatch;

  const name = pb.stoc_hs_player_enter.name;
  const pos = pb.stoc_hs_player_enter.pos;

  if (pos > 1) {
    console.log("Currently only supported 2v2 mode.");
  } else {
    // pos == 0 ? dispatch(player0Enter(name)) : dispatch(player1Enter(name));
    playerStore[pos == 0 ? "player0" : "player1"].name = name;
  }
}
