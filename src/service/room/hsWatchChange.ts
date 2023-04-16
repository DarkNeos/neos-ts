import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { observerChange } from "@/reducers/playerSlice";
import { store } from "@/store";
import { playerStore } from "@/valtioStores";

export default function handleHsWatchChange(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const count = pb.stoc_hs_watch_change.count;
  dispatch(observerChange(count));
  playerStore.observerCount = count;
}
