import { ygopro } from "@/api";
import { matStore } from "@/stores";

const NO_READY_STATE = "not ready";

export default function handleTypeChange(pb: ygopro.YgoStocMsg) {
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;

  matStore.isHost = assertHost;
  matStore.selfType = selfType;

  if (assertHost) {
    switch (selfType) {
      case ygopro.StocTypeChange.SelfType.PLAYER1: {
        matStore.player[0].isHost = true;
        matStore.player[1].isHost = false;
        matStore.player[0].state = NO_READY_STATE;
        break;
      }
      case ygopro.StocTypeChange.SelfType.PLAYER2: {
        matStore.player[0].isHost = false;
        matStore.player[1].isHost = true;
        matStore.player[1].state = NO_READY_STATE;
        break;
      }
      default: {
        break;
      }
    }
  }
}
