import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import onMsgStart from "./start";
import onMsgDraw from "./draw";
import onMsgNewTurn from "./newTurn";
import onMsgNewPhase from "./newPhase";
import onMsgHint from "./hint";

export default function handleGameMsg(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;
  const msg = pb.stoc_game_msg;

  switch (msg.gameMsg) {
    case "start": {
      const start = msg.start;

      onMsgStart(start, dispatch);

      break;
    }
    case "draw": {
      const draw = msg.draw;

      onMsgDraw(draw, dispatch);

      break;
    }
    case "new_turn": {
      const newTurn = msg.new_turn;

      onMsgNewTurn(newTurn, dispatch);

      break;
    }
    case "new_phase": {
      const newPhase = msg.new_phase;

      onMsgNewPhase(newPhase, dispatch);

      break;
    }
    case "hint": {
      const hint = msg.hint;

      onMsgHint(hint, dispatch);

      break;
    }
    default: {
      break;
    }
  }
}
