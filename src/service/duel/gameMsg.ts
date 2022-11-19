import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import { meInfoInit, opInfoInit } from "../../reducers/duel/mod";

export default function handleGameMsg(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;
  const msg = pb.stoc_game_msg;

  switch (msg.gameMsg) {
    case "start": {
      const start = msg.start;

      dispatch(
        meInfoInit({
          playerType: start.playerType.toString(),
          life: start.life1,
          deckSize: start.deckSize1,
          extraSize: start.extraSize1,
        })
      );

      dispatch(
        opInfoInit({
          life: start.life2,
          deckSize: start.deckSize2,
          extraSize: start.extraSize2,
        })
      );

      break;
    }
    case "draw": {
      // TODO
      console.log(msg.draw);

      break;
    }
    default: {
      console.log("Unhandled GameMsg=" + msg.gameMsg);

      break;
    }
  }
}
