import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import { selectTpAble } from "../../reducers/moraSlice";

export default function handleSelectTp(_: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  dispatch(selectTpAble());
}
