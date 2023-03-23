import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

/*
 * Msg Select Tribute
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家可选择的祭品
 * */

export default (data: Uint8Array) => {
  // FIXME: handle it correctly
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const cancelable = reader.inner.readUint8() != 0;
  const min = reader.inner.readUint8();
  const max = reader.inner.readUint8();
  const count = reader.inner.readUint8();

  const msg = new MsgSelectCard({ player, cancelable, min, max });

  for (let i = 0; i < count; i++) {
    const code = reader.inner.readUint32();
    const controler = reader.inner.readUint8();
    const location = reader.inner.readUint8();
    const sequence = reader.inner.readUint8();
    const release_param = reader.inner.readUint8();

    msg.cards.push(
      new MsgSelectCard.SelectAbleCard({
        code,
        location: new ygopro.CardLocation({
          controler,
          location,
          sequence,
        }),
        response: i,
        release_param,
      })
    );
  }

  return msg;
};
