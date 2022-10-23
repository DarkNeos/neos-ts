import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, ygoProtobuf } from "../packet";
import { utf8ArrayToStr } from "../util";

export default class StocChatPB implements ygoProtobuf {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  adapt(): ygopro.YgoStocMsg {
    const player = new DataView(this.packet.exData.buffer).getInt16(0, true);
    const msg = utf8ArrayToStr(this.packet.exData.slice(2));

    return new ygopro.YgoStocMsg({
      stoc_chat: new ygopro.StocChat({
        player,
        msg,
      }),
    });
  }
}
