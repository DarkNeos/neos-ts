import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, StocAdapter } from "../packet";

/*
 * STOC SelectTp
 *
 * @usage - 通知客户端/前端提醒用户进行选先后攻
 * */
export default class selectTp implements StocAdapter {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_select_tp: new ygopro.StocSelectTp({}),
    });
  }
}
