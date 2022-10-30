import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import { selectHandAble } from "../../reducers/moraSlice";

export default function handleSelectHand(_: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  dispatch(selectHandAble());
}
