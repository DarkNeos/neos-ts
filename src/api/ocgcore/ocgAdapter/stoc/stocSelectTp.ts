import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC SelectTp
 *
 * @usage - 通知客户端/前端提醒用户进行选先后攻
 * */
export default class SelectTp implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_select_tp: new ygopro.StocSelectTp({}),
    });
  }
}
