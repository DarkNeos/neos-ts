import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";

/*
 * Msg Damage
 *
 * @param player - 玩家编号
 * @param value - 减少的Hp数值
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const player = reader.readUint8();
  const value = reader.readInt32();

  return new ygopro.StocGameMessage.MsgUpdateHp({
    player,
    type_: ygopro.StocGameMessage.MsgUpdateHp.ActionType.DAMAGE,
    value,
  });
};
