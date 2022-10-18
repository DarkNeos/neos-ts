import { ygopro } from "../api/idl/ocgcore";
import { store } from "../store";
import { setJoined } from "../reducers/joinSlice";
import { postChat } from "../reducers/chatSlice";
import {
  player0Enter,
  player1Enter,
  player0Update,
  player1Update,
  player0Leave,
  player1Leave,
  hostChange,
  observerIncrement,
  observerChange,
  updateIsHost,
} from "../reducers/playerSlice";

const READY_STATE = "ready";
const NO_READY_STATE = "not ready";

export default function handleSocketMessage(e: MessageEvent) {
  const pb = ygopro.YgoStocMsg.deserializeBinary(e.data);
  const dispatch = store.dispatch;

  switch (pb.msg) {
    case "stoc_join_game": {
      const msg = pb.stoc_join_game;
      // todo

      dispatch(setJoined());
      break;
    }
    case "stoc_chat": {
      const chat = pb.stoc_chat;

      dispatch(postChat(chat.msg));
      break;
    }
    case "stoc_hs_player_change": {
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
            console.log(
              "Player " + change.pos + " moved to " + change.moved_pos
            );

            let src = change.pos;
            let dst = change.moved_pos;

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

            break;
          }
          case ygopro.StocHsPlayerChange.State.NO_READY: {
            change.pos == 0
              ? dispatch(player0Update(NO_READY_STATE))
              : dispatch(player1Update(NO_READY_STATE));

            break;
          }
          case ygopro.StocHsPlayerChange.State.LEAVE: {
            change.pos == 0 ? dispatch(player0Leave) : dispatch(player1Leave);

            break;
          }
          case ygopro.StocHsPlayerChange.State.TO_OBSERVER: {
            change.pos == 0 ? dispatch(player0Leave) : dispatch(player1Leave);
            dispatch(observerIncrement());

            break;
          }
          default: {
            break;
          }
        }
      }

      break;
    }
    case "stoc_hs_watch_change": {
      const count = pb.stoc_hs_watch_change.count;
      dispatch(observerChange(count));

      break;
    }
    case "stoc_hs_player_enter": {
      const name = pb.stoc_hs_player_enter.name;
      const pos = pb.stoc_hs_player_enter.pos;

      if (pos > 1) {
        console.log("Currently only supported 2v2 mode.");
      } else {
        pos == 0 ? dispatch(player0Enter(name)) : dispatch(player1Enter(name));
      }

      break;
    }
    case "stoc_type_change": {
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

      break;
    }
    default: {
      break;
    }
  }
}
