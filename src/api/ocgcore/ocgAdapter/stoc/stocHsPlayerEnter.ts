import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, ygoProtobuf } from "../packet";
import { UTF16_BUFFER_MAX_LEN } from "../util";

const UINT8_PER_UINT16 = 2;

export default class StocHsPlayerEnter implements ygoProtobuf {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  adapt(): ygopro.YgoStocMsg {
    const exData = this.packet.exData;

    const decoder = new TextDecoder("utf-16");
    const name = decoder.decode(
      exData.slice(0, UTF16_BUFFER_MAX_LEN * UINT8_PER_UINT16)
    );

    const dataView = new DataView(exData.buffer);
    const pos = dataView.getInt8(UTF16_BUFFER_MAX_LEN * UINT8_PER_UINT16) & 0x3;

    return new ygopro.YgoStocMsg({
      stoc_hs_player_enter: new ygopro.StocHsPlayerEnter({
        name,
        pos,
      }),
    });
  }
}
