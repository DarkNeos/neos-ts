import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, StocAdapter } from "../packet";

/*
 * STOC SelectHand
 *
 * @usage - 通知客户端/前端提醒用户进行猜拳选择
 * */
export default class selectHand implements StocAdapter {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_select_hand: new ygopro.StocSelectHand({}),
    });
  }
}
