import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import onMsgStart from "./start";
import onMsgDraw from "./draw";
import onMsgNewTurn from "./newTurn";
import onMsgNewPhase from "./newPhase";
import onMsgHint from "./hint";
import onMsgSelectIdleCmd from "./selectIdleCmd";
import onMsgSelectPlace from "./selectPlace";

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
    case "select_idle_cmd": {
      const selectIdleCmd = msg.select_idle_cmd;

      onMsgSelectIdleCmd(selectIdleCmd, dispatch);

      break;
    }
    case "select_place": {
      const selectPlace = msg.select_place;

      onMsgSelectPlace(selectPlace, dispatch);

      break;
    }
    default: {
      break;
    }
  }
}
