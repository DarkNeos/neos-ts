import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

import onMsgAttack from "./attack";
import onMsgAttackDisable from "./attackDisable";
import onMsgChaining from "./chaining";
import onMsgChainSolved from "./chainSolved";
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

const NeosConfig = useConfig();

export default function handleGameMsg(pb: ygopro.YgoStocMsg) {
  // 防止MSG更新太频繁，做下控频
  //
  // TODO: 细化需要控频的MSG
  setTimeout(() => {
    const msg = pb.stoc_game_msg;

    if (ActiveList.includes(msg.gameMsg)) {
      matStore.waiting = false;
    }

    // 先重置`delay`
    matStore.delay = 0;

    switch (msg.gameMsg) {
      case "start": {
        onMsgStart(msg.start);

        break;
      }
      case "draw": {
        onMsgDraw(msg.draw);

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
        onMsgMove(msg.move);

        matStore.delay = NeosConfig.ui.moveDelay;

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
        onMsgSelectOption(msg.select_option);

        break;
      }
      case "shuffle_hand": {
        onMsgShuffleHand(msg.shuffle_hand);

        break;
      }
      case "select_battle_cmd": {
        onMsgSelectBattleCmd(msg.select_battle_cmd);

        break;
      }
      case "pos_change": {
        onMsgPosChange(msg.pos_change);

        break;
      }
      case "select_unselect_card": {
        onMsgSelectUnselectCard(msg.select_unselect_card);

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
        onMsgUpdateData(msg.update_data);

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
        onMsgAttack(msg.attack);

        break;
      }
      case "attack_disable": {
        onMsgAttackDisable(msg.attack_disable);

        break;
      }
      case "chaining": {
        onMsgChaining(msg.chaining);

        matStore.delay = NeosConfig.ui.chainingDelay;

        break;
      }
      case "chain_solved": {
        onMsgChainSolved(msg.chain_solved);

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
      case "unimplemented": {
        onUnimplemented(msg.unimplemented);

        break;
      }
      default: {
        break;
      }
    }
  }, matStore.delay);
}
