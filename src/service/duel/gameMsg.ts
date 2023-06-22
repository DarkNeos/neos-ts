import { ygopro } from "@/api";
import { sleep } from "@/infra";
import { matStore } from "@/stores";
import { showWaiting } from "@/ui/Duel/Message";

import onAnnounce from "./announce";
import onMsgAttack from "./attack";
import onMsgAttackDisable from "./attackDisable";
import onMsgBecomeTarget from "./becomeTarget";
import onMsgChainEnd from "./chainEnd";
import onMsgChaining from "./chaining";
import onMsgChainSolved from "./chainSolved";
import onConfirmCards from "./confirmCards";
import onMsgDraw from "./draw";
import onMsgFieldDisabled from "./fieldDisabled";
import onMsgFilpSummoned from "./flipSummoned";
import onMsgFlipSummoning from "./flipSummoning";
import onMsgHint from "./hint";
import onLpUpdate from "./lpUpdate";
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
import onMsgShuffleDeck from "./shuffleDeck";
import onMsgShuffleHand from "./shuffleHand";
import onMsgShuffleSetCard from "./shuffleSetCard";
import onMsgSortCard from "./sortCard";
import onMsgSpSummoned from "./spSummoned";
import onMsgSpSummoning from "./spSummoning";
import onMsgStart from "./start";
import onMsgSummoned from "./summoned";
import onMsgSummoning from "./summoning";
import onMsgSwap from "./swap";
import onMsgToss from "./toss";
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

let animation: Promise<unknown> = new Promise<void>((rs) => rs());

export default async function handleGameMsg(pb: ygopro.YgoStocMsg) {
  animation = animation.then(() => _handleGameMsg(pb));
  // _handleGameMsg(pb);
}

async function _handleGameMsg(pb: ygopro.YgoStocMsg) {
  const msg = pb.stoc_game_msg;

  if (ActiveList.includes(msg.gameMsg)) {
    showWaiting(false);
  }

  switch (msg.gameMsg) {
    case "start": {
      await onMsgStart(msg.start);

      break;
    }
    case "draw": {
      await onMsgDraw(msg.draw);

      break;
    }
    case "new_turn": {
      onMsgNewTurn(msg.new_turn);

      break;
    }
    case "new_phase": {
      onMsgNewPhase(msg.new_phase);

      break;
    }
    case "hint": {
      onMsgHint(msg.hint);

      break;
    }
    case "select_idle_cmd": {
      onMsgSelectIdleCmd(msg.select_idle_cmd);

      break;
    }
    case "select_place": {
      onMsgSelectPlace(msg.select_place);

      break;
    }
    case "move": {
      await onMsgMove(msg.move);
      await sleep(500);

      break;
    }
    case "select_card": {
      onMsgSelectCard(msg.select_card);

      break;
    }
    case "select_chain": {
      onMsgSelectChain(msg.select_chain);

      break;
    }
    case "select_effect_yn": {
      onMsgSelectEffectYn(msg.select_effect_yn);

      break;
    }
    case "select_position": {
      onMsgSelectPosition(msg.select_position);

      break;
    }
    case "select_option": {
      await onMsgSelectOption(msg.select_option);

      break;
    }
    case "shuffle_hand": {
      await onMsgShuffleHand(msg.shuffle_hand);

      break;
    }
    case "select_battle_cmd": {
      onMsgSelectBattleCmd(msg.select_battle_cmd);

      break;
    }
    case "pos_change": {
      await onMsgPosChange(msg.pos_change);

      break;
    }
    case "select_unselect_card": {
      await onMsgSelectUnselectCard(msg.select_unselect_card);

      break;
    }
    case "select_yes_no": {
      onMsgSelectYesNo(msg.select_yes_no);

      break;
    }
    case "update_hp": {
      onMsgUpdateHp(msg.update_hp);

      break;
    }
    case "win": {
      onMsgWin(msg.win);

      break;
    }
    case "wait": {
      onMsgWait(msg.wait);

      break;
    }
    case "update_data": {
      await onMsgUpdateData(msg.update_data);

      break;
    }
    case "reload_field": {
      onMsgReloadField(msg.reload_field);

      break;
    }
    case "select_sum": {
      onMsgSelectSum(msg.select_sum);

      break;
    }
    case "select_tribute": {
      onMsgSelectTribute(msg.select_tribute);

      break;
    }
    case "update_counter": {
      onMsgUpdateCounter(msg.update_counter);

      break;
    }
    case "select_counter": {
      onMsgSelectCounter(msg.select_counter);

      break;
    }
    case "sort_card": {
      onMsgSortCard(msg.sort_card);

      break;
    }
    case "set": {
      onMsgSet(msg.set);

      break;
    }
    case "swap": {
      onMsgSwap(msg.swap);

      break;
    }
    case "attack": {
      await onMsgAttack(msg.attack);

      break;
    }
    case "attack_disable": {
      onMsgAttackDisable(msg.attack_disable);

      break;
    }
    case "chaining": {
      await onMsgChaining(msg.chaining);

      break;
    }
    case "chain_solved": {
      await onMsgChainSolved(msg.chain_solved);

      break;
    }
    case "chain_end": {
      onMsgChainEnd(msg.chain_end);

      break;
    }
    case "summoning": {
      onMsgSummoning(msg.summoning);

      break;
    }
    case "summoned": {
      onMsgSummoned(msg.summoned);

      break;
    }
    case "flip_summoning": {
      onMsgFlipSummoning(msg.flip_summoning);

      break;
    }
    case "flip_summoned": {
      onMsgFilpSummoned(msg.flip_summoned);

      break;
    }
    case "sp_summoning": {
      onMsgSpSummoning(msg.sp_summoning);

      break;
    }
    case "sp_summoned": {
      onMsgSpSummoned(msg.sp_summoned);

      break;
    }
    case "announce": {
      await onAnnounce(msg.announce);

      break;
    }
    case "lp_update": {
      onLpUpdate(msg.lp_update);

      break;
    }
    case "confirm_cards": {
      await onConfirmCards(msg.confirm_cards);

      break;
    }
    case "become_target": {
      onMsgBecomeTarget(msg.become_target);

      break;
    }
    case "toss": {
      onMsgToss(msg.toss);

      break;
    }
    case "shuffle_set_card": {
      await onMsgShuffleSetCard(msg.shuffle_set_card);

      break;
    }
    case "field_disabled": {
      onMsgFieldDisabled(msg.field_disabled);

      break;
    }
    case "shuffle_deck": {
      onMsgShuffleDeck(msg.shuffle_deck);

      break;
    }
    case "unimplemented": {
      onUnimplemented(msg.unimplemented);

      break;
    }
    default: {
      break;
    }
  }
}
