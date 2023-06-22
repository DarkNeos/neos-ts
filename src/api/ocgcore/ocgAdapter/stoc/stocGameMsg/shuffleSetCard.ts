import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import { BufferReaderExt } from "../../bufferIO";
import { numberToCardZone } from "../../util";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

/*
 * Msg Shuffle Set Card
 * @param - TODO
 *
 * @usage - 盖卡切洗
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const zone = numberToCardZone(reader.inner.readUint8());
  const count = reader.inner.readUint8();
  const from_locations = [];
  const overlay_locations = []; // TODO: 这个字段是否有用？
  for (let i = 0; i < count; i++) {
    from_locations.push(reader.readCardLocation());
  }
  for (let i = 0; i < count; i++) {
    overlay_locations.push(reader.readCardLocation());
  }

  return new MsgShuffleSetCard({
    zone,
    from_locations,
    overlay_locations,
  });
};
