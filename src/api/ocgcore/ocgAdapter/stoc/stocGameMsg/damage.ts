import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";

import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;
import ActionType = ygopro.StocGameMessage.MsgUpdateHp.ActionType;

/*
 * Msg Damage
 *
 * @param player - 玩家编号
 * @param value - 减少的Hp数值
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readInt8();
  const value = reader.readInt32();

  return new MsgUpdateHp({
    player,
    type_: ActionType.DAMAGE,
    value,
  });
};
