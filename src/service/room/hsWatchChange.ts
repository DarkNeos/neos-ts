import { ygopro } from "../../api/idl/ocgcore";
import { observerChange } from "../../reducers/playerSlice";
import { store } from "../../store";

export default function handleHsWatchChange(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const count = pb.stoc_hs_watch_change.count;
  dispatch(observerChange(count));
}
