import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, ygoProtobuf } from "../packet";

export default class StocHsWatchChange implements ygoProtobuf {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  adapt(): ygopro.YgoStocMsg {
    const count = new DataView(this.packet.exData.buffer).getUint16(0, true);

    return new ygopro.YgoStocMsg({
      stoc_hs_watch_change: new ygopro.StocHsWatchChange({
        count,
      }),
    });
  }
}
