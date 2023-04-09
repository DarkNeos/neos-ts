import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "rust-src";
import MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

/*
 * Msg Select Position
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.neos-protobuf
 * @usage - 玩家选择表示形式
 *
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  const code = reader.readUint32();
  const positions = reader.readUint8();

  const msg = new MsgSelectPosition({
    player,
    code,
    positions: [],
  });

  if ((positions & 0x1) > 0) {
    msg.positions.push(
      new MsgSelectPosition.SelectAblePosition({
        position: ygopro.CardPosition.FACEUP_ATTACK,
      })
    );
  }
  if ((positions & 0x2) > 0) {
    msg.positions.push(
      new MsgSelectPosition.SelectAblePosition({
        position: ygopro.CardPosition.FACEDOWN_ATTACK,
      })
    );
  }
  if ((positions & 0x4) > 0) {
    msg.positions.push(
      new MsgSelectPosition.SelectAblePosition({
        position: ygopro.CardPosition.FACEUP_DEFENSE,
      })
    );
  }
  if ((positions & 0x8) > 0) {
    msg.positions.push(
      new MsgSelectPosition.SelectAblePosition({
        position: ygopro.CardPosition.FACEDOWN_DEFENSE,
      })
    );
  }

  return msg;
};
