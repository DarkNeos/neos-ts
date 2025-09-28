import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";

/*
 * MSG New Turn
 *
 * @param player: char - 下一个操作的玩家编号
 *
 * @usage - 服务端告诉前端下一个操作的玩家
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();

  return new ygopro.StocGameMessage.MsgNewTurn({
    player,
  });
};
