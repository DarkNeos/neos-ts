import { ygopro } from "@/api";
import {
  hostChange,
  player0Update,
  player1Update,
  updateIsHost,
} from "@/reducers/playerSlice";
import { store } from "@/store";
import { playerStore } from "@/valtioStores";

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

        playerStore.player0.isHost = true;
        playerStore.player1.isHost = false;
        playerStore.player0.state = NO_READY_STATE;

        break;
      }
      case ygopro.StocTypeChange.SelfType.PLAYER2: {
        dispatch(hostChange(0));
        dispatch(player1Update(NO_READY_STATE));

        playerStore.player0.isHost = false;
        playerStore.player1.isHost = true;
        playerStore.player1.state = NO_READY_STATE;

        break;
      }
      default: {
        break;
      }
    }
  }
}
