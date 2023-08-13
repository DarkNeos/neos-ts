import { ygopro } from "@/api";
import { roomStore } from "@/stores";
import SelfType = ygopro.StocTypeChange.SelfType;

export default function handleTypeChange(pb: ygopro.YgoStocMsg) {
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;

  roomStore.isHost = assertHost;
  roomStore.selfType = selfType;

  switch (selfType) {
    case SelfType.UNKNOWN: {
      console.warn("<HandleTypeChange>selfType is UNKNOWN");
      break;
    }
    case SelfType.OBSERVER: {
      roomStore.players.forEach((player) => {
        if (player) {
          player.isMe = false;
        }
      });
      break;
    }
    default: {
      const player = roomStore.players[selfType - 1];
      const state = ygopro.StocHsPlayerChange.State.NO_READY;
      if (player) {
        player.state = state;
        player.isMe = true;
      } else {
        roomStore.players[selfType - 1] = { name: "?", state, isMe: true };
      }
      break;
    }
  }
}
