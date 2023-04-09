import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import {
  player0Update,
  player1Update,
  hostChange,
  updateIsHost,
} from "@/reducers/playerSlice";
import { store } from "@/store";

const NO_READY_STATE = "not ready";

export default function handleTypeChange(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;

  dispatch(updateIsHost(assertHost));

  if (assertHost) {
    switch (selfType) {
      case ygopro.StocTypeChange.SelfType.PLAYER1: {
        dispatch(hostChange(0));
        dispatch(player0Update(NO_READY_STATE));

        break;
      }
      case ygopro.StocTypeChange.SelfType.PLAYER2: {
        dispatch(hostChange(0));
        dispatch(player1Update(NO_READY_STATE));

        break;
      }
      default: {
        break;
      }
    }
  }
}
