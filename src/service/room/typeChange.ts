import { ygopro } from "@/api";
import { playerStore } from "@/stores";

const NO_READY_STATE = "not ready";

export default function handleTypeChange(pb: ygopro.YgoStocMsg) {
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;

  playerStore.isHost = assertHost;

  if (assertHost) {
    switch (selfType) {
      case ygopro.StocTypeChange.SelfType.PLAYER1: {
        playerStore.player0.isHost = true;
        playerStore.player1.isHost = false;
        playerStore.player0.state = NO_READY_STATE;
        break;
      }
      case ygopro.StocTypeChange.SelfType.PLAYER2: {
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
