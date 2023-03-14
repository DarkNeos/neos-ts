import { ygopro } from "../../../idl/ocgcore";
import init, { ocgDamageAdapter } from "rust-src";

/*
 * Msg Damage
 *
 * @param player - 玩家编号
 * @param value - 减少的Hp数值
 * */
export default async (data: Uint8Array) => {
  const damage = await init().then(() => ocgDamageAdapter(data));

  return new ygopro.StocGameMessage.MsgUpdateHp(damage);
};
