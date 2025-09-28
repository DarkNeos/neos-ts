import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { BufferReader } from "@/infra";
import MsgAnnounce = ygopro.StocGameMessage.MsgAnnounce;

/*
 * Announce Attribute
 *
 * @param - TODO
 * @usage - 声明属性
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  const min = reader.readUint8();
  const avaiable = reader.readUint32();

  const options = [];

  for (let i = 0; i < 7; i++) {
    if ((avaiable & (1 << i)) > 0) {
      options.push(
        new MsgAnnounce.Option({
          code: i,
          response: 1 << i,
        }),
      );
    }
  }

  return new MsgAnnounce({
    player,
    announce_type: MsgAnnounce.AnnounceType.Attribute,
    min,
    options,
  });
};
