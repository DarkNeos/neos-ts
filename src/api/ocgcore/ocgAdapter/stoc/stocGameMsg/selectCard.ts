import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

/*
 * Msg Select Card
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家可选择的卡牌
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const cancelable = reader.inner.readUint8() != 0;
  const min = reader.inner.readUint8();
  const max = reader.inner.readUint8();
  const count = reader.inner.readUint8();

  const msg = new MsgSelectCard({ player, cancelable, min, max });

  for (let i = 0; i < count; i++) {
    const code = reader.inner.readUint32();
    const location = reader.readCardLocation();

    msg.cards.push(
      new MsgSelectCard.SelectAbleCard({ code, location, response: i })
    );
  }

  return msg;
};
