import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC DuelStart
 *
 * @usage - 通知客户端决斗开始
 * */
export default class DuelStart implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    return new ygopro.YgoStocMsg({
      stoc_duel_start: new ygopro.StocDuelStart({}),
    });
  }
}
