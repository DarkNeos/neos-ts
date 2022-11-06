/*
 * STOC GameMsg协议Adapter逻辑
 *
 * */

import { ygopro } from "../../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../../packet";

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
    // TODO
    return new ygopro.YgoStocMsg({});
  }
}
