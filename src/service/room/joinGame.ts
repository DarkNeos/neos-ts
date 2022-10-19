import { ygopro } from "../../api/idl/ocgcore";
import { store } from "../../store";
import { setJoined } from "../../reducers/joinSlice";

export default function handleJoinGame(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const msg = pb.stoc_join_game;
  // todo
  dispatch(setJoined());
}
