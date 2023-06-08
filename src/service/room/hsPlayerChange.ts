import { ygopro } from "@/api";
import { matStore } from "@/stores";

const READY_STATE = "ready";
const NO_READY_STATE = "not ready";

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
        console.log("Player " + change.pos + " moved to " + change.moved_pos);

        let _src = change.pos;
        let _dst = change.moved_pos;

        console.log("Currently unsupport Move type of StocHsPlayerChange.");

        // TODO

        break;
      }
      case ygopro.StocHsPlayerChange.State.READY: {
        matStore.player[change.pos === 0 ? 0 : 1].state = READY_STATE;
        break;
      }
      case ygopro.StocHsPlayerChange.State.NO_READY: {
        matStore.player[change.pos === 0 ? 0 : 1].state = NO_READY_STATE;

        break;
      }
      case ygopro.StocHsPlayerChange.State.LEAVE: {
        matStore.player[change.pos === 0 ? 0 : 1] = {};

        break;
      }
      case ygopro.StocHsPlayerChange.State.TO_OBSERVER: {
        matStore.player[change.pos === 0 ? 0 : 1] = {}; // todo: 有没有必要？
        matStore.observerCount += 1;
        break;
      }
      default: {
        break;
      }
    }
  }
}
