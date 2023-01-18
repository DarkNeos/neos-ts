import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import MsgSelectUnselectCard = ygopro.StocGameMessage.MsgSelectUnselectCard;

/*
 * Msg Select Unselect Card
 *
 * @param -
 *
 * @usage - 玩家选择未选择的卡牌
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const finishable = reader.readUint8() != 0;
  const cancelable = reader.readUint8() != 0;
  const min = reader.readUint8();
  const max = reader.readUint8();

  const msg = new MsgSelectUnselectCard({
    player,
    finishable,
    cancelable,
    min,
    max,
  });

  const count1 = reader.readUint8();
  for (let i = 0; i < count1; i++) {
    const code = reader.readUint32();
    const location = reader.readCardLocation();

    msg.selectable_cards.push(
      new MsgSelectUnselectCard.Info({ code, location, response: i })
    );
  }

  const count2 = reader.readUint8();
  for (let i = count1; i < count1 + count2; i++) {
    const code = reader.readUint32();
    const location = reader.readCardLocation();

    msg.selected_cards.push(
      new MsgSelectUnselectCard.Info({ code, location, response: i })
    );
  }

  return msg;
};
