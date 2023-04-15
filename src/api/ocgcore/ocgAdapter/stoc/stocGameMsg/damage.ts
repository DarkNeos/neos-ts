import { ocgDamageAdapter } from "rust-src";

import { ygopro } from "../../../idl/ocgcore";

/*
 * Msg Damage
 *
 * @param player - 玩家编号
 * @param value - 减少的Hp数值
 * */
export default (data: Uint8Array) => {
  const damage = ocgDamageAdapter(data);

  return new ygopro.StocGameMessage.MsgUpdateHp(damage);
};
