import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { setWaiting } from "@/reducers/duel/mod";
import { store } from "@/store";

import onMsgAttack from "./attack";
import onMsgAttackDisable from "./attackDisable";
import onMsgChaining from "./chaining";
import onMsgDraw from "./draw";
import onMsgFilpSummoned from "./flipSummoned";
import onMsgFlipSummoning from "./flipSummoning";
import onMsgHint from "./hint";
import onMsgMove from "./move";
import onMsgNewPhase from "./newPhase";
import onMsgNewTurn from "./newTurn";
import onMsgPosChange from "./posChange";
import onMsgReloadField from "./reloadField";
import onMsgSelectBattleCmd from "./selectBattleCmd";
import onMsgSelectCard from "./selectCard";
import onMsgSelectChain from "./selectChain";
import onMsgSelectCounter from "./selectCounter";
import onMsgSelectEffectYn from "./selectEffectYn";
import onMsgSelectIdleCmd from "./selectIdleCmd";
import onMsgSelectOption from "./selectOption";
import onMsgSelectPlace from "./selectPlace";
import onMsgSelectPosition from "./selectPosition";
import onMsgSelectSum from "./selectSum";
import onMsgSelectTribute from "./selectTribute";
import onMsgSelectUnselectCard from "./selectUnselectCard";
import onMsgSelectYesNo from "./selectYesNo";
import onMsgSet from "./set";
import onMsgShuffleHand from "./shuffleHand";
import onMsgSortCard from "./sortCard";
import onMsgSpSummoned from "./spSummoned";
import onMsgSpSummoning from "./spSummoning";
import onMsgStart from "./start";
import onMsgSummoned from "./summoned";
import onMsgSummoning from "./summoning";
import onMsgSwap from "./swap";
import onUnimplemented from "./unimplemented";
import onMsgUpdateCounter from "./updateCounter";
import onMsgUpdateData from "./updateData";
import onMsgUpdateHp from "./updateHp";
import onMsgWait from "./wait";
import onMsgWin from "./win";

const ActiveList = [
  "select_idle_cmd",
  "select_place",
  "select_card",
  "select_chain",
  "select_effect_yn",
  "select_position",
  "select_option",
  "select_battle_cmd",
  "select_unselect_card",
  "select_yes_no",
];

export default function handleGameMsg(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;
  const msg = pb.stoc_game_msg;

  if (ActiveList.includes(msg.gameMsg)) {
    dispatch(setWaiting(false));
  }

  switch (msg.gameMsg) {
    case "start": {
      onMsgStart(msg.start, dispatch);

      break;
    }
    case "draw": {
      onMsgDraw(msg.draw, dispatch);

      break;
    }
    case "new_turn": {
      onMsgNewTurn(msg.new_turn, dispatch);

      break;
    }
    case "new_phase": {
      onMsgNewPhase(msg.new_phase, dispatch);

      break;
    }
    case "hint": {
      onMsgHint(msg.hint, dispatch);

      break;
    }
    case "select_idle_cmd": {
      onMsgSelectIdleCmd(msg.select_idle_cmd, dispatch);

      break;
    }
    case "select_place": {
      onMsgSelectPlace(msg.select_place, dispatch);

      break;
    }
    case "move": {
      onMsgMove(msg.move, dispatch);

      break;
    }
    case "select_card": {
      onMsgSelectCard(msg.select_card, dispatch);

      break;
    }
    case "select_chain": {
      onMsgSelectChain(msg.select_chain, dispatch);

      break;
    }
    case "select_effect_yn": {
      onMsgSelectEffectYn(msg.select_effect_yn, dispatch);

      break;
    }
    case "select_position": {
      onMsgSelectPosition(msg.select_position, dispatch);

      break;
    }
    case "select_option": {
      onMsgSelectOption(msg.select_option, dispatch);

      break;
    }
    case "shuffle_hand": {
      onMsgShuffleHand(msg.shuffle_hand, dispatch);

      break;
    }
    case "select_battle_cmd": {
      onMsgSelectBattleCmd(msg.select_battle_cmd, dispatch);

      break;
    }
    case "pos_change": {
      onMsgPosChange(msg.pos_change, dispatch);

      break;
    }
    case "select_unselect_card": {
      onMsgSelectUnselectCard(msg.select_unselect_card, dispatch);

      break;
    }
    case "select_yes_no": {
      onMsgSelectYesNo(msg.select_yes_no, dispatch);

      break;
    }
    case "update_hp": {
      onMsgUpdateHp(msg.update_hp, dispatch);

      break;
    }
    case "win": {
      onMsgWin(msg.win, dispatch);

      break;
    }
    case "wait": {
      onMsgWait(msg.wait, dispatch);

      break;
    }
    case "update_data": {
      onMsgUpdateData(msg.update_data, dispatch);

      break;
    }
    case "reload_field": {
      onMsgReloadField(msg.reload_field, dispatch);

      break;
    }
    case "select_sum": {
      onMsgSelectSum(msg.select_sum, dispatch);

      break;
    }
    case "select_tribute": {
      onMsgSelectTribute(msg.select_tribute, dispatch);

      break;
    }
    case "update_counter": {
      onMsgUpdateCounter(msg.update_counter, dispatch);

      break;
    }
    case "select_counter": {
      onMsgSelectCounter(msg.select_counter, dispatch);

      break;
    }
    case "sort_card": {
      onMsgSortCard(msg.sort_card, dispatch);

      break;
    }
    case "set": {
      onMsgSet(msg.set, dispatch);

      break;
    }
    case "swap": {
      onMsgSwap(msg.swap, dispatch);

      break;
    }
    case "attack": {
      onMsgAttack(msg.attack, dispatch);

      break;
    }
    case "attack_disable": {
      onMsgAttackDisable(msg.attack_disable, dispatch);

      break;
    }
    case "chaining": {
      onMsgChaining(msg.chaining, dispatch);

      break;
    }
    case "summoning": {
      onMsgSummoning(msg.summoning, dispatch);

      break;
    }
    case "summoned": {
      onMsgSummoned(msg.summoned, dispatch);

      break;
    }
    case "flip_summoning": {
      onMsgFlipSummoning(msg.flip_summoning, dispatch);

      break;
    }
    case "flip_summoned": {
      onMsgFilpSummoned(msg.flip_summoned, dispatch);

      break;
    }
    case "sp_summoning": {
      onMsgSpSummoning(msg.sp_summoning, dispatch);

      break;
    }
    case "sp_summoned": {
      onMsgSpSummoned(msg.sp_summoned, dispatch);

      break;
    }
    case "unimplemented": {
      onUnimplemented(msg.unimplemented, dispatch);

      break;
    }
    default: {
      break;
    }
  }
}
