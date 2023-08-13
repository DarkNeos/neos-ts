import { BufferReader } from "../../../../../rust-src/pkg/rust_src";
import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

/*
 * STOC HandResult
 *
 * @usage - 后端告诉前端玩家们的猜拳选择
 * */
export default class SelectHand implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const reader = new BufferReader(this.packet.exData);
    const meResult = reader.readUint8();
    const opResult = reader.readUint8();
    return new ygopro.YgoStocMsg({
      stoc_hand_result: new ygopro.StocHandResult({
        meResult,
        opResult,
      }),
    });
  }
}
