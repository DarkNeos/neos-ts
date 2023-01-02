import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgSelectCard = ygopro.StocGameMessage.MsgSelectCard;

/*
 * Msg Select Card
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家可选择的卡牌
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const cancelable = reader.readUint8() != 0;
  const min = reader.readUint8();
  const max = reader.readUint8();
  const count = reader.readUint8();

  const msg = new MsgSelectCard({ player, cancelable, min, max });

  for (let i = 0; i < count; i++) {
    const code = reader.readUint32();
    const location = reader.readCardLocation();

    msg.cards.push(
      new MsgSelectCard.SelectAbleCard({ code, location, response: i })
    );
  }

  return msg;
};
