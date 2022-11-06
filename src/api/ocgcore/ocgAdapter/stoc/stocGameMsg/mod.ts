/*
 * STOC GameMsg协议Adapter逻辑
 *
 * */

import { ygopro } from "../../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../../packet";
import { MSG_START } from "../../protoDecl";
import MsgStartAdapter from "./start";

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
      case MSG_START: {
        gameMsg.start = MsgStartAdapter(gameData);

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
