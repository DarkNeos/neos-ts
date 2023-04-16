/*
 * STOC GameMsg协议Adapter逻辑
 *
 * */

import { ygopro } from "../../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../../packet";
import * as GAME_MSG from "../../protoDecl";
import MsgAddCounter from "./addCounter";
import MsgDamage from "./damage";
import MsgDrawAdapter from "./draw";
import MsgHintAdapter from "./hint";
import MsgNewPhaseAdapter from "./newPhase";
import MsgNewTurnAdapter from "./newTurn";
import PENETRATE from "./penetrate";
import MsgRecover from "./recover";
import MsgReloadFieldAdapter from "./reloadField";
import MsgRemoveCounter from "./removeCounter";
import MsgSelectBattleCmdAdapter from "./selectBattleCmd";
import MsgSelectCardAdapter from "./selectCard";
import MsgSelectChainAdapter from "./selectChain";
import MsgSelectCounter from "./selectCounter";
import MsgSelectEffectYnAdapter from "./selectEffectYn";
import MsgSelectIdleCmdAdapter from "./selectIdleCmd";
import MsgSelectOptionAdapter from "./selectOption";
import MsgSelectPlaceAdapter from "./selectPlace";
import MsgSelectPositionAdapter from "./selectPosition";
import MsgSelectSum from "./selectSum";
import MsgSelectTributeAdapter from "./selectTribute";
import MsgSelectUnselectCardAdapter from "./selectUnselectCard";
import MsgSortCard from "./sortCard";
import MsgStartAdapter from "./start";
import MsgUpdateDataAdapter from "./updateData";
import MsgWaitAdapter from "./wait";
import MsgWin from "./win";

/*
 * STOC GameMsg
 *
 * @param function: unsigned chat - GameMsg协议的function编号
 * @param data: binary bytes - GameMsg协议的数据
 *
 * @usage - 服务端告诉前端/客户端决斗对局中的UI展示逻辑
 * */
export default class GameMsgAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const exData = this.packet.exData;
    const dataView = new DataView(exData.buffer);

    const func = dataView.getUint8(0);
    const gameData = exData.slice(1);
    let gameMsg: any = new ygopro.StocGameMessage({}).toObject();

    if (!PENETRATE.penetrate(func, gameMsg, gameData)) {
      switch (func) {
        case GAME_MSG.MSG_START: {
          gameMsg.start = MsgStartAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_DRAW: {
          gameMsg.draw = MsgDrawAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_NEW_TURN: {
          gameMsg.new_turn = MsgNewTurnAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_NEW_PHASE: {
          gameMsg.new_phase = MsgNewPhaseAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_HINT: {
          gameMsg.hint = MsgHintAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_IDLE_CMD: {
          gameMsg.select_idle_cmd = MsgSelectIdleCmdAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_PLACE: {
          gameMsg.select_place = MsgSelectPlaceAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_CARD: {
          gameMsg.select_card = MsgSelectCardAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_TRIBUTE: {
          gameMsg.select_tribute = MsgSelectTributeAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_CHAIN: {
          gameMsg.select_chain = MsgSelectChainAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_EFFECTYN: {
          gameMsg.select_effect_yn = MsgSelectEffectYnAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_POSITION: {
          gameMsg.select_position = MsgSelectPositionAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_OPTION: {
          gameMsg.select_option = MsgSelectOptionAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_BATTLE_CMD: {
          gameMsg.select_battle_cmd = MsgSelectBattleCmdAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_UNSELECT_CARD: {
          gameMsg.select_unselect_card = MsgSelectUnselectCardAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_PAY_LP_COST:
        case GAME_MSG.MSG_DAMAGE: {
          gameMsg.update_hp = MsgDamage(gameData);

          break;
        }
        case GAME_MSG.MSG_RECOVER: {
          gameMsg.update_hp = MsgRecover(gameData);

          break;
        }
        case GAME_MSG.MSG_WIN: {
          gameMsg.win = MsgWin(gameData);

          break;
        }
        case GAME_MSG.MSG_WAITING: {
          gameMsg.wait = MsgWaitAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_UPDATE_DATA: {
          gameMsg.update_data = MsgUpdateDataAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_RELOAD_FIELD: {
          gameMsg.reload_field = MsgReloadFieldAdapter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_SUM: {
          gameMsg.select_sum = MsgSelectSum(gameData);

          break;
        }
        case GAME_MSG.MSG_ADD_COUNTER: {
          gameMsg.update_counter = MsgAddCounter(gameData);

          break;
        }
        case GAME_MSG.MSG_REMOVE_COUNTER: {
          gameMsg.update_counter = MsgRemoveCounter(gameData);

          break;
        }
        case GAME_MSG.MSG_SELECT_COUNTER: {
          gameMsg.select_counter = MsgSelectCounter(gameData);

          break;
        }
        case GAME_MSG.MSG_SORT_CARD: {
          gameMsg.sort_card = MsgSortCard(gameData);

          break;
        }
        default: {
          gameMsg.unimplemented = new ygopro.StocGameMessage.MsgUnimplemented({
            command: func,
          });

          break;
        }
      }
    }

    return new ygopro.YgoStocMsg({
      stoc_game_msg: new ygopro.StocGameMessage(gameMsg),
    });
  }
}
