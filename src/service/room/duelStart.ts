import { ygopro } from "@/api";
import { duelStart } from "@/reducers/moraSlice";
import { store } from "@/store";
import { moraStore } from "@/valtioStores";

export default function handleDuelStart(_pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  dispatch(duelStart());
  moraStore.duelStart = true;
}
