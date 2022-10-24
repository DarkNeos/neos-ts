import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, ygoProtobuf } from "../packet";

export default class StocHsPlayerChange implements ygoProtobuf {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  adapt(): ygopro.YgoStocMsg {
    const pb = new ygopro.StocHsPlayerChange({});
    pb.state = ygopro.StocHsPlayerChange.State.UNKNOWN;

    const Status = new DataView(this.packet.exData.buffer).getUint8(0);
    const pos = (Status >> 4) & 0xf;
    const state = Status & 0xf;

    if (pos < 4) {
      if (state < 8) {
        pb.state = ygopro.StocHsPlayerChange.State.MOVE;
        pb.moved_pos = state;
      } else if (state === 0x9) {
        pb.state = ygopro.StocHsPlayerChange.State.READY;
      } else if (state === 0xa) {
        pb.state = ygopro.StocHsPlayerChange.State.NO_READY;
      } else if (state === 0xb) {
        pb.state = ygopro.StocHsPlayerChange.State.LEAVE;
      } else if (state === 0x8) {
        pb.state = ygopro.StocHsPlayerChange.State.TO_OBSERVER;
      }
    }

    return new ygopro.YgoStocMsg({
      stoc_hs_player_change: pb,
    });
  }
}
