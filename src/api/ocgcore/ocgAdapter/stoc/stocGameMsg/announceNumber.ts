import { BufferReader } from "rust-src";

import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import MsgAnnounce = ygopro.StocGameMessage.MsgAnnounce;

/*
 * Announce Number
 *
 * @param - TODO
 * @usage - 声明数字
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  const count = reader.readUint8();

  const options = [];

  for (let i = 0; i < count; i++) {
    const num = reader.readUint32();
    options.push(
      new MsgAnnounce.Option({
        code: num,
        response: i,
      }),
    );
  }

  return new MsgAnnounce({
    player,
    announce_type: MsgAnnounce.AnnounceType.Number,
    options,
  });
};
