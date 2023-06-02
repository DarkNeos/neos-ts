import { ygopro } from "@/api/ocgcore/idl/ocgcore";

import { BufferReaderExt } from "../../bufferIO";
import MsgAttack = ygopro.StocGameMessage.MsgAttack;

/*
 * Msg Attack
 *
 * @param attacker_location - 攻击者位置
 * @param target_location - 攻击目标位置，可能为空
 * @param direct_attack - 是否直接攻击玩家
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const attacker_location = reader.readCardLocation();
  const target_location = reader.readCardLocation();

  if (
    target_location.controler == 0 &&
    target_location.zone == 0 &&
    target_location.sequence == 0
  ) {
    // 全零表示直接攻击玩家
    return new MsgAttack({
      attacker_location,
      direct_attack: true,
    });
  } else {
    return new MsgAttack({
      attacker_location,
      target_location,
      direct_attack: false,
    });
  }
};
