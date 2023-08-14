import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectTribute = ygopro.StocGameMessage.MsgSelectTribute;

/*
 * Msg Select Tribute
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家可选择的祭品
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const cancelable = reader.inner.readUint8() != 0;
  const min = reader.inner.readUint8();
  const max = reader.inner.readUint8();
  const count = reader.inner.readUint8();

  const msg = new MsgSelectTribute({
    player,
    cancelable,
    min,
    max,
    selectable_cards: [],
  });

  for (let i = 0; i < count; i++) {
    const code = reader.inner.readUint32();
    const location = reader.readCardShortLocation();
    const level = reader.inner.readUint8();

    msg.selectable_cards.push(
      new MsgSelectTribute.Info({
        code,
        location,
        level,
        response: i,
      }),
    );
  }

  return msg;
};
