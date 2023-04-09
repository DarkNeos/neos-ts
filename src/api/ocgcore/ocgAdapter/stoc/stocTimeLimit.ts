import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../packet";
import { BufferReader } from "rust-src";

/*
 * STOC TimeLimit
 *
 * @usage - 同时客户端/前端时间限制
 * */

export default class TimeLimit implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const reader = new BufferReader(this.packet.exData);

    const player = reader.readInt8();
    const leftTime = reader.readUint16();

    return new ygopro.YgoStocMsg({
      stoc_time_limit: new ygopro.StocTimeLimit({
        player,
        left_time: leftTime,
      }),
    });
  }
}
