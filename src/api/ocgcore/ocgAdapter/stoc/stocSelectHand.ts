import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC SelectHand
 *
 * @usage - 通知客户端/前端提醒用户进行猜拳选择
 * */
export default class SelectHand implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_select_hand: new ygopro.StocSelectHand({}),
    });
  }
}
