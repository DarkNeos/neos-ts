import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { setJoined } from "@/reducers/joinSlice";
import { store } from "@/store";
import { joinStore } from "@/valtioStores";

export default function handleJoinGame(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const msg = pb.stoc_join_game;
  // todo
  dispatch(setJoined());

  joinStore.value = true;
}
