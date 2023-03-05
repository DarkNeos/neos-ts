import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { duelStart } from "../../reducers/moraSlice";
import { store } from "../../store";

export default function handleDuelStart(_pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  dispatch(duelStart());
}
