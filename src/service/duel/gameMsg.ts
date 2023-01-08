import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { store } from "../../store";
import onMsgStart from "./start";
import onMsgDraw from "./draw";
import onMsgNewTurn from "./newTurn";
import onMsgNewPhase from "./newPhase";
import onMsgHint from "./hint";
import onMsgSelectIdleCmd from "./selectIdleCmd";
import onMsgSelectPlace from "./selectPlace";
import onMsgMove from "./move";
import onMsgSelectCard from "./selectCard";
import onMsgSelectChain from "./selectChain";
import onMsgSelectEffectYn from "./selectEffectYn";
import onMsgSelectPosition from "./selectPosition";
import onMsgSelectOption from "./selectOption";

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
    case "move": {
      const move = msg.move;
      onMsgMove(move, dispatch);

      break;
    }
    case "select_card": {
      const selectCard = msg.select_card;
      onMsgSelectCard(selectCard, dispatch);

      break;
    }
    case "select_chain": {
      const selectChain = msg.select_chain;
      onMsgSelectChain(selectChain, dispatch);

      break;
    }
    case "select_effect_yn": {
      const selectEffectYn = msg.select_effect_yn;
      onMsgSelectEffectYn(selectEffectYn, dispatch);

      break;
    }
    case "select_position": {
      const selectPosition = msg.select_position;
      onMsgSelectPosition(selectPosition, dispatch);

      break;
    }
    case "select_option": {
      const selectOption = msg.select_option;
      onMsgSelectOption(selectOption, dispatch);

      break;
    }
    default: {
      break;
    }
  }
}
