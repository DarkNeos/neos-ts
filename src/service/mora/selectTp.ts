import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { selectTpAble } from "@/reducers/moraSlice";
import { store } from "@/store";

export default function handleSelectTp(_: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  dispatch(selectTpAble());
}
