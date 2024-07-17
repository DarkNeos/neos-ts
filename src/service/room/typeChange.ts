import { ygopro } from "@/api";
import SelfType = ygopro.StocTypeChange.SelfType;
import { Container } from "@/container";

export default function handleTypeChange(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;
  const context = container.context;

  context.roomStore.isHost = assertHost;
  context.roomStore.selfType = selfType;

  switch (selfType) {
    case SelfType.UNKNOWN: {
      console.warn("<HandleTypeChange>selfType is UNKNOWN");
      break;
    }
    case SelfType.OBSERVER: {
      context.roomStore.players.forEach((player) => {
        if (player) {
          player.isMe = false;
        }
      });
      break;
    }
    default: {
      const player = context.roomStore.players[selfType - 1];
      const state = ygopro.StocHsPlayerChange.State.NO_READY;
      if (player) {
        player.state = state;
        player.isMe = true;
      } else {
        context.roomStore.players[selfType - 1] = {
          name: "?",
          state,
          isMe: true,
        };
      }
      break;
    }
  }
}
