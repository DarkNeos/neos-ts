import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";
import MsgToss = ygopro.StocGameMessage.MsgToss;

/*
 * Msg Toss
 * @param - TODO
 *
 * @usage 骰子/硬币结果
 * */
export default (data: Uint8Array, toss_type: MsgToss.TossType) => {
  const reader = new BufferReader(data);
  const player = reader.readUint8();
  const count = reader.readUint8();

  const res = [];
  for (let i = 0; i < count; i++) {
    res.push(reader.readUint8());
  }

  return new MsgToss({
    player,
    toss_type,
    res,
  });
};
