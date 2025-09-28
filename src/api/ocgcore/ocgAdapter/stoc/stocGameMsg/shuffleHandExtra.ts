import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { BufferReader } from "@/infra";
import MsgShuffleHandExtra = ygopro.StocGameMessage.MsgShuffleHandExtra;

/*
 * Msg Shuffle Hand or Extra
 * @param - TODO
 *
 * @usage - 手牌/额外卡组切洗
 * */
export default (data: Uint8Array, isExtra: boolean) => {
  const reader = new BufferReader(data);

  const zone = isExtra ? ygopro.CardZone.EXTRA : ygopro.CardZone.HAND;
  const player = reader.readUint8();

  const count = reader.readUint8();
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(reader.readUint32());
  }

  return new MsgShuffleHandExtra({
    player,
    zone,
    cards,
  });
};
