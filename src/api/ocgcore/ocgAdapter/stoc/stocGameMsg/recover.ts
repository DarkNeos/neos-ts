import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "rust-src";

/*
 * Msg Recover
 *
 * @param player - 玩家编号
 * @param value - 回复的Hp数值
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  const value = reader.readInt32();

  return new ygopro.StocGameMessage.MsgUpdateHp({
    player,
    type_: ygopro.StocGameMessage.MsgUpdateHp.ActionType.RECOVER,
    value,
  });
};
