import { ygopro } from "../../idl/ocgcore";
import { StocAdapter, YgoProPacket } from "../packet";

const LITTLE_ENDIAN = true;
const INT16_BYTE_OFFSET = 2;

/*
 * STOC DeckCount
 *
 * @param see ocgcore.proto
 *
 * @usage - 展示双方卡组信息
 * */

export default class DeckCountAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    const pb = new ygopro.StocDeckCount({});

    const dataView = new DataView(this.packet.exData.buffer);
    pb.meMain = dataView.getInt16(0 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);
    pb.meExtra = dataView.getInt16(1 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);
    pb.meSide = dataView.getInt16(2 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);
    pb.opMain = dataView.getInt16(3 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);
    pb.opExtra = dataView.getInt16(4 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);
    pb.opSide = dataView.getInt16(5 * INT16_BYTE_OFFSET, LITTLE_ENDIAN);

    return new ygopro.YgoStocMsg({
      stoc_deck_count: pb,
    });
  }
}
