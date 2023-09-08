import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC DuelEnd
 *
 * @usage - 通知客户端决斗结束
 * */
export default class DuelEnd implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_duel_end: new ygopro.StocDuelEnd({}),
    });
  }
}
