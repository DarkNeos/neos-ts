import { ygopro } from "@/api";
import { roomStore } from "@/stores";

export default function handleHsPlayerChange(pb: ygopro.YgoStocMsg) {
  const change = pb.stoc_hs_player_change;

  if (change.pos > 1) {
    console.log("Currently only supported 2v2 mode.");
  } else {
    switch (change.state) {
      case ygopro.StocHsPlayerChange.State.UNKNOWN: {
        console.log("Unknown HsPlayerChange State");

        break;
      }
      case ygopro.StocHsPlayerChange.State.MOVE: {
        // TODO: 这个分支可能有BUG，后面注意一下
        console.info(
          "<HsPlayerChange>Player " +
            change.pos +
            " moved to " +
            change.moved_pos
        );
        roomStore.players[change.moved_pos] = roomStore.players[change.pos];
        roomStore.players[change.pos] = undefined;
        break;
      }
      case ygopro.StocHsPlayerChange.State.READY:
      case ygopro.StocHsPlayerChange.State.NO_READY: {
        const player = roomStore.players[change.pos];
        if (player) {
          player.state = change.state;
        }
        break;
      }
      case ygopro.StocHsPlayerChange.State.LEAVE: {
        roomStore.players[change.pos] = undefined;
        break;
      }
      case ygopro.StocHsPlayerChange.State.TO_OBSERVER: {
        roomStore.players[change.pos] = undefined;
        roomStore.observerCount += 1;
        break;
      }
      default: {
        break;
      }
    }
  }
}
