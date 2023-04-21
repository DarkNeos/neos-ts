import { ygopro } from "@/api";
import {
  observerIncrement,
  player0Leave,
  player0Update,
  player1Leave,
  player1Update,
} from "@/reducers/playerSlice";
import { store } from "@/store";
import { playerStore } from "@/valtioStores";

const READY_STATE = "ready";
const NO_READY_STATE = "not ready";

export default function handleHsPlayerChange(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;
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

        let src = change.pos;
        let dst = change.moved_pos;

        console.log("Currently unsupport Move type of StocHsPlayerChange.");

        // todo

        // if (src === 0 && dst === 1) {
        //   setPlayer1(player0);
        //   setPlayer0({});
        // } else if (src === 1 && dst === 0) {
        //   setPlayer0(player1);
        //   setPlayer1({});
        // }

        break;
      }
      case ygopro.StocHsPlayerChange.State.READY: {
        change.pos == 0
          ? dispatch(player0Update(READY_STATE))
          : dispatch(player1Update(READY_STATE));
        playerStore[change.pos == 0 ? "player0" : "player1"].state =
          READY_STATE;
        break;
      }
      case ygopro.StocHsPlayerChange.State.NO_READY: {
        change.pos == 0
          ? dispatch(player0Update(NO_READY_STATE))
          : dispatch(player1Update(NO_READY_STATE));
        playerStore[change.pos == 0 ? "player0" : "player1"].state =
          NO_READY_STATE;

        break;
      }
      case ygopro.StocHsPlayerChange.State.LEAVE: {
        change.pos == 0 ? dispatch(player0Leave) : dispatch(player1Leave);
        playerStore[change.pos == 0 ? "player0" : "player1"] = {};

        break;
      }
      case ygopro.StocHsPlayerChange.State.TO_OBSERVER: {
        change.pos == 0 ? dispatch(player0Leave) : dispatch(player1Leave);
        dispatch(observerIncrement());
        playerStore[change.pos == 0 ? "player0" : "player1"] = {}; // todo: 有没有必要？
        playerStore.observerCount += 1;
        break;
      }
      default: {
        break;
      }
    }
  }
}
