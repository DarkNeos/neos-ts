/*
 * STOC GameMsg协议Adapter逻辑
 *
 * */

import { ygopro } from "../../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../../packet";
import * as GAME_MSG from "../../protoDecl";
import MsgStartAdapter from "./start";
import MsgDrawAdapter from "./draw";
import MsgNewTurnAdapter from "./newTurn";
import MsgNewPhaseAdapter from "./newPhase";
import MsgHintAdapter from "./hint";
import MsgSelectIdleCmdAdapter from "./selectIdleCmd";
import MsgSelectPlaceAdapter from "./selectPlace";
import MsgMoveAdapter from "./move";
import MsgSelectCardAdapter from "./selectCard";
import MsgSelectChainAdapter from "./selectChain";

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
    const gameMsg = new ygopro.StocGameMessage({});

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
      case GAME_MSG.MSG_MOVE: {
        gameMsg.move = MsgMoveAdapter(gameData);

        break;
      }
      case GAME_MSG.MSG_SELECT_CARD: {
        gameMsg.select_card = MsgSelectCardAdapter(gameData);

        break;
      }
      case GAME_MSG.MSG_SELECT_CHAIN: {
        gameMsg.select_chain = MsgSelectChainAdapter(gameData);

        break;
      }
      default: {
        console.log("Unhandled GameMessage function=", func);

        break;
      }
    }

    return new ygopro.YgoStocMsg({
      stoc_game_msg: gameMsg,
    });
  }
}
