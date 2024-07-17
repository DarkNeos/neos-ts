import { ygopro } from "@/api";
import { Container } from "@/container";
import { replayStore } from "@/stores";
import { showWaiting } from "@/ui/Duel/Message";

import { YgoAgent } from "./agent";
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
import onMsgHandResult from "./handResult";
import onMsgHint from "./hint";
import onLpUpdate from "./lpUpdate";
import onMsgMove from "./move";
import onMsgNewPhase from "./newPhase";
import onMsgNewTurn from "./newTurn";
import onMsgPosChange from "./posChange";
import onMsgReloadField from "./reloadField";
import onMsgRockPaperScissors from "./rockPaperScissors";
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
import onMsgShuffleHandExtra from "./shuffleHandExtra";
import onMsgShuffleSetCard from "./shuffleSetCard";
import onMsgSibylName from "./sibylName";
import onMsgSortCard from "./sortCard";
import onMsgSpSummoned from "./spSummoned";
import onMsgSpSummoning from "./spSummoning";
import onMsgStart from "./start";
import onMsgSummoned from "./summoned";
import onMsgSummoning from "./summoning";
import onMsgSwap from "./swap";
import onMsgSwapGraveDeck from "./swapGraveDeck";
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
  "select_tribute",
  "select_counter",
  "select_sum",
  "rock_paper_scissors",
  "sort_card",
  "announce",
];

export default async function handleGameMsg(
  container: Container,
  pb: ygopro.YgoStocMsg,
  agent?: YgoAgent,
): Promise<void> {
  const msg = pb.stoc_game_msg;

  if (ActiveList.includes(msg.gameMsg)) {
    showWaiting(false);

    if (replayStore.isReplay) return;

    if (agent && !agent.getDisable()) {
      console.info(`Handling msg: ${msg.gameMsg} with YgoAgent`);
      const enableKuriboh = container.getEnableKuriboh();

      try {
        await agent.sendAIPredictAsResponse(container.conn, msg, enableKuriboh);
        if (enableKuriboh) return;
      } catch (e) {
        console.error(`Erros occurs when handling msg ${msg.gameMsg}: ${e}`);
        container.setEnableKuriboh(false);
        // TODO: I18N
        container.context.matStore.error = `AI模型监测到场上存在它没见过的卡片，
        因此需要关掉AI辅助功能。\n
        请耐心等待开发团队对模型进行优化，感谢！`;
        agent.setDisable(true);
      }
    }
  }

  switch (msg.gameMsg) {
    case "start": {
      await onMsgStart(container, msg.start);

      // We should init agent when the MSG_START reached.
      if (agent) await agent.init();

      break;
    }
    case "draw": {
      await onMsgDraw(container, msg.draw);

      break;
    }
    case "new_turn": {
      onMsgNewTurn(container, msg.new_turn);

      break;
    }
    case "new_phase": {
      onMsgNewPhase(container, msg.new_phase);

      break;
    }
    case "hint": {
      await onMsgHint(container, msg.hint);

      break;
    }
    case "select_idle_cmd": {
      onMsgSelectIdleCmd(container, msg.select_idle_cmd);

      break;
    }
    case "select_place": {
      onMsgSelectPlace(container, msg.select_place);

      break;
    }
    case "move": {
      await onMsgMove(container, msg.move);
      break;
    }
    case "select_card": {
      onMsgSelectCard(container, msg.select_card);

      break;
    }
    case "select_chain": {
      onMsgSelectChain(container, msg.select_chain);

      break;
    }
    case "select_effect_yn": {
      await onMsgSelectEffectYn(msg.select_effect_yn);

      break;
    }
    case "select_position": {
      await onMsgSelectPosition(msg.select_position);

      break;
    }
    case "select_option": {
      await onMsgSelectOption(container, msg.select_option);

      break;
    }
    case "shuffle_hand_extra": {
      await onMsgShuffleHandExtra(container, msg.shuffle_hand_extra);

      break;
    }
    case "select_battle_cmd": {
      onMsgSelectBattleCmd(container, msg.select_battle_cmd);

      break;
    }
    case "pos_change": {
      await onMsgPosChange(container, msg.pos_change);

      break;
    }
    case "select_unselect_card": {
      await onMsgSelectUnselectCard(container, msg.select_unselect_card);

      break;
    }
    case "select_yes_no": {
      await onMsgSelectYesNo(msg.select_yes_no);

      break;
    }
    case "update_hp": {
      onMsgUpdateHp(container, msg.update_hp);

      break;
    }
    case "win": {
      await onMsgWin(container, msg.win);

      break;
    }
    case "wait": {
      onMsgWait(container, msg.wait);

      break;
    }
    case "update_data": {
      await onMsgUpdateData(container, msg.update_data);

      break;
    }
    case "reload_field": {
      onMsgReloadField(container, msg.reload_field);

      break;
    }
    case "select_sum": {
      onMsgSelectSum(container, msg.select_sum);

      break;
    }
    case "select_tribute": {
      onMsgSelectTribute(container, msg.select_tribute);

      break;
    }
    case "update_counter": {
      onMsgUpdateCounter(container, msg.update_counter);

      break;
    }
    case "select_counter": {
      await onMsgSelectCounter(container, msg.select_counter);

      break;
    }
    case "sort_card": {
      await onMsgSortCard(msg.sort_card);

      break;
    }
    case "set": {
      onMsgSet(container, msg.set);

      break;
    }
    case "swap": {
      onMsgSwap(container, msg.swap);

      break;
    }
    case "attack": {
      await onMsgAttack(container, msg.attack);

      break;
    }
    case "attack_disable": {
      onMsgAttackDisable(container, msg.attack_disable);

      break;
    }
    case "chaining": {
      await onMsgChaining(container, msg.chaining);
      break;
    }
    case "chain_solved": {
      await onMsgChainSolved(container, msg.chain_solved);

      break;
    }
    case "chain_end": {
      onMsgChainEnd(container, msg.chain_end);

      break;
    }
    case "summoning": {
      onMsgSummoning(container, msg.summoning);

      break;
    }
    case "summoned": {
      onMsgSummoned(container, msg.summoned);

      break;
    }
    case "flip_summoning": {
      onMsgFlipSummoning(container, msg.flip_summoning);

      break;
    }
    case "flip_summoned": {
      onMsgFilpSummoned(container, msg.flip_summoned);

      break;
    }
    case "sp_summoning": {
      onMsgSpSummoning(container, msg.sp_summoning);

      break;
    }
    case "sp_summoned": {
      onMsgSpSummoned(container, msg.sp_summoned);

      break;
    }
    case "announce": {
      await onAnnounce(msg.announce);

      break;
    }
    case "lp_update": {
      onLpUpdate(container, msg.lp_update);

      break;
    }
    case "confirm_cards": {
      await onConfirmCards(container, msg.confirm_cards);
      break;
    }
    case "become_target": {
      onMsgBecomeTarget(container, msg.become_target);

      break;
    }
    case "toss": {
      onMsgToss(container, msg.toss);

      break;
    }
    case "shuffle_set_card": {
      await onMsgShuffleSetCard(container, msg.shuffle_set_card);

      break;
    }
    case "field_disabled": {
      onMsgFieldDisabled(container, msg.field_disabled);

      break;
    }
    case "shuffle_deck": {
      onMsgShuffleDeck(container, msg.shuffle_deck);

      break;
    }
    case "rock_paper_scissors": {
      await onMsgRockPaperScissors(msg.rock_paper_scissors);

      break;
    }
    case "hand_res": {
      onMsgHandResult(container, msg.hand_res);

      break;
    }
    case "swap_grave_deck": {
      await onMsgSwapGraveDeck(container, msg.swap_grave_deck);

      break;
    }
    case "sibyl_name": {
      onMsgSibylName(container, msg.sibyl_name);

      break;
    }
    case "unimplemented": {
      onUnimplemented(container, msg.unimplemented);

      break;
    }
    default: {
      break;
    }
  }
}
