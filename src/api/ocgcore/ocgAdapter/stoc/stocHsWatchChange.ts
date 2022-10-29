import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, StocAdapter } from "../packet";

export default class hsWatchChangeAdapter implements StocAdapter {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const count = new DataView(this.packet.exData.buffer).getUint16(0, true);

    return new ygopro.YgoStocMsg({
      stoc_hs_watch_change: new ygopro.StocHsWatchChange({
        count,
      }),
    });
  }
}
