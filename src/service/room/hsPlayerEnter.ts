import { ygopro } from "../../api/idl/ocgcore";
import { store } from "../../store";
import { player0Enter, player1Enter } from "../../reducers/playerSlice";

export default function handleHsPlayerEnter(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const name = pb.stoc_hs_player_enter.name;
  const pos = pb.stoc_hs_player_enter.pos;

  if (pos > 1) {
    console.log("Currently only supported 2v2 mode.");
  } else {
    pos == 0 ? dispatch(player0Enter(name)) : dispatch(player1Enter(name));
  }
}
